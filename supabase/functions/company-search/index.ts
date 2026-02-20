import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface CompanyData {
  name?: string;
  ustId?: string;
  hrb?: string;
  address?: {
    street?: string;
    zip?: string;
    city?: string;
    country?: string;
  };
  website?: string;
}

interface SearchResponse {
  success: boolean;
  data: CompanyData;
  error?: string;
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const BROWSERLESS_URL = 'https://chrome.browserless.io/content';

// CORS allowed origins
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://liqinow.de',
  'https://www.liqinow.de',
  'https://liqinow.de.s3-website.nl-ams.scw.cloud',
];

const corsHeaders = (origin: string | null) => {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    const { website } = await req.json();

    if (!website) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bitte geben Sie eine Website an.' }),
        { status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error('[Company Search] OPENAI_API_KEY not set');
      return new Response(
        JSON.stringify({ success: false, error: 'API nicht konfiguriert' }),
        { status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Extract company data from website
    const companyData = await extractCompanyDataFromWebsite(website, apiKey);

    if (!companyData || !companyData.name) {
      return new Response(
        JSON.stringify({
          success: false,
          data: {},
          error: 'Keine Firmendaten gefunden. Bitte überprüfen Sie die Website-URL.',
        }),
        { status: 200, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: companyData,
      }),
      { status: 200, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Company Search] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Ein Fehler ist aufgetreten.' }),
      { status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Fetch rendered HTML from Browserless (headless Chrome)
 * Used as fallback for JS-rendered SPAs (React, Vue, etc.)
 */
async function fetchWithBrowserless(url: string): Promise<string | null> {
  const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
  if (!browserlessApiKey) {
    console.log('[Company Search] BROWSERLESS_API_KEY not set, skipping headless rendering');
    return null;
  }

  console.log(`[Company Search] Fetching with Browserless: ${url}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${BROWSERLESS_URL}?token=${browserlessApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        gotoOptions: {
          waitUntil: 'networkidle2',
          timeout: 20000,
        },
        waitForSelector: {
          selector: 'body',
          timeout: 10000,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Company Search] Browserless error: ${response.status}`, errorText);
      return null;
    }

    const html = await response.text();
    console.log(`[Company Search] Browserless returned ${html.length} chars`);
    return html;
  } catch (error) {
    console.error('[Company Search] Browserless fetch error:', error);
    return null;
  }
}

/**
 * Fallback for SPAs without Browserless: fetch JS bundles and extract text content
 * from JSX children patterns (e.g. children:"Impressum text...")
 */
async function extractTextFromSPABundles(html: string, baseUrl: string): Promise<string | null> {
  const scriptPattern = /<script[^>]*src=["']([^"']+\.js)["'][^>]*>/gi;
  const bundleUrls: string[] = [];
  let match;

  while ((match = scriptPattern.exec(html)) !== null) {
    let scriptUrl = match[1];
    if (scriptUrl.startsWith('/')) {
      const urlObj = new URL(baseUrl);
      scriptUrl = `${urlObj.protocol}//${urlObj.host}${scriptUrl}`;
    } else if (!scriptUrl.startsWith('http')) {
      const urlObj = new URL(baseUrl);
      scriptUrl = `${urlObj.protocol}//${urlObj.host}/${scriptUrl}`;
    }
    bundleUrls.push(scriptUrl);
  }

  if (bundleUrls.length === 0) {
    console.log('[Company Search] No JS bundles found in HTML');
    return null;
  }

  console.log(`[Company Search] Found ${bundleUrls.length} JS bundle(s), extracting text...`);

  const impressumMarkers = ['angaben gemäß', '§ 5 tmg', '§ 5 ddg'];

  for (const bundleUrl of bundleUrls) {
    try {
      const bundleResponse = await fetch(bundleUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LiqiNow-Bot/1.0)' },
      });

      if (!bundleResponse.ok) continue;

      const bundleText = await bundleResponse.text();
      console.log(`[Company Search] Fetched bundle: ${bundleUrl} (${bundleText.length} chars)`);

      const lowerBundle = bundleText.toLowerCase();
      if (!impressumMarkers.some(m => lowerBundle.includes(m))) continue;

      console.log('[Company Search] Bundle contains Impressum content, extracting JSX text...');

      // Extract text content from JSX children:"..." patterns
      const childrenPattern = /children:\s*["']([^"']{2,500})["']/g;
      let strMatch;
      const textContent: { text: string; index: number }[] = [];

      while ((strMatch = childrenPattern.exec(bundleText)) !== null) {
        const str = strMatch[1];
        if (str.includes('m.jsx') || str.includes('m.jsxs')) continue;
        if (str.startsWith(',') || str.startsWith('{')) continue;
        textContent.push({ text: str, index: strMatch.index });
      }

      if (textContent.length === 0) continue;

      // Find the Impressum section marker
      let impressumIdx = -1;
      for (let i = 0; i < textContent.length; i++) {
        const lower = textContent[i].text.toLowerCase();
        if (impressumMarkers.some(m => lower.includes(m))) {
          impressumIdx = i;
          break;
        }
      }

      if (impressumIdx === -1) continue;

      // Take ~25 strings after the Impressum marker
      const section = textContent.slice(impressumIdx, impressumIdx + 25);
      const extractedText = section.map(s => s.text).join('\n');
      console.log(`[Company Search] Extracted ${section.length} text strings from Impressum section (${extractedText.length} chars)`);
      return extractedText;
    } catch (error) {
      console.error(`[Company Search] Failed to fetch bundle ${bundleUrl}:`, error);
    }
  }

  return null;
}

/**
 * Check if HTML content looks like a JS-rendered SPA (minimal content)
 */
function isLikelySPA(html: string): boolean {
  const cleanText = extractRelevantText(html);

  // If extracted text is very short, likely a SPA with no server-rendered content
  if (cleanText.length < 150) {
    console.log(`[Company Search] Content too short (${cleanText.length} chars), likely SPA`);
    return true;
  }

  // Check for common SPA indicators
  const spaIndicators = [
    '<div id="root"></div>',
    '<div id="root">',
    '<div id="app"></div>',
    '<div id="app">',
    '<div id="__next"></div>',
    'window.__INITIAL_STATE__',
    'window.__NUXT__',
  ];

  const lowerHtml = html.toLowerCase();
  for (const indicator of spaIndicators) {
    if (lowerHtml.includes(indicator.toLowerCase())) {
      // Only flag as SPA if content is actually thin
      if (cleanText.length < 500) {
        console.log(`[Company Search] SPA indicator found: ${indicator}, content thin (${cleanText.length} chars)`);
        return true;
      }
    }
  }

  return false;
}

async function extractCompanyDataFromWebsite(
  website: string,
  apiKey: string
): Promise<CompanyData | null> {
  try {
    // Normalize URL
    let normalizedUrl = website.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    console.log(`[Company Search] Fetching ${normalizedUrl}...`);

    // Step 1: Try normal fetch first
    let html = await fetchWithSimpleRequest(normalizedUrl);
    const originalHtml = html; // Keep original for SPA bundle fallback
    let detectedSPA = false;

    // Step 2: Check if we need Browserless (SPA/React site)
    if (html && isLikelySPA(html)) {
      detectedSPA = true;
      console.log('[Company Search] Detected SPA, trying Browserless...');
      const renderedHtml = await fetchWithBrowserless(normalizedUrl);
      if (renderedHtml) {
        html = renderedHtml;
      }
    }

    if (!html) {
      // Last resort: try Browserless directly
      console.log('[Company Search] Normal fetch failed, trying Browserless directly...');
      html = await fetchWithBrowserless(normalizedUrl);
    }

    if (!html) {
      console.error('[Company Search] Could not fetch website content');
      return null;
    }

    // Try to find and fetch Impressum page
    const impressumUrl = findImpressumUrl(html, normalizedUrl);
    if (impressumUrl) {
      console.log(`[Company Search] Found Impressum: ${impressumUrl}`);

      // Try simple fetch first for Impressum
      let impressumHtml = await fetchWithSimpleRequest(impressumUrl);

      // If Impressum fetch failed or looks like SPA, use Browserless
      if (!impressumHtml || isLikelySPA(impressumHtml)) {
        console.log('[Company Search] Impressum not available or SPA, using Browserless...');
        const renderedImpressum = await fetchWithBrowserless(impressumUrl);
        if (renderedImpressum) {
          impressumHtml = renderedImpressum;
        }
      }

      if (impressumHtml) {
        html = impressumHtml;
        console.log(`[Company Search] Using Impressum content: ${html.length} chars`);
      }
    }

    // Extract relevant text
    let cleanText = extractRelevantText(html);

    // SPA fallback: if content is still too thin, extract text from JS bundles
    if (detectedSPA && (!cleanText || cleanText.length < 100) && originalHtml) {
      console.log('[Company Search] SPA content too thin, trying JS bundle extraction...');
      const bundleText = await extractTextFromSPABundles(originalHtml, normalizedUrl);
      if (bundleText && bundleText.length >= 50) {
        cleanText = bundleText;
        console.log(`[Company Search] Using bundle-extracted text: ${cleanText.length} chars`);
      }
    }

    if (!cleanText || cleanText.length < 50) {
      console.error('[Company Search] No relevant content found');
      return null;
    }

    console.log(`[Company Search] Extracted ${cleanText.length} chars of text`);

    // Send to ChatGPT
    const prompt = createExtractionPrompt(cleanText, normalizedUrl);

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Du bist ein Experte für das Extrahieren von Firmendaten aus Website-Inhalten, insbesondere aus dem Impressum deutscher Unternehmen. Antworte immer nur mit validen JSON-Daten.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Company Search] OpenAI Error: ${response.status}`, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('[Company Search] No content in response');
      return null;
    }

    console.log('[Company Search] ChatGPT response:', content);

    const extracted = JSON.parse(content);

    const companyData: CompanyData = {
      name: extracted.name || undefined,
      ustId: extracted.ustId || extracted.ust_id || undefined,
      hrb: extracted.hrb || undefined,
      website: normalizedUrl,
      address: {
        street: extracted.address?.street || extracted.street || undefined,
        zip: extracted.address?.zip || extracted.zip || undefined,
        city: extracted.address?.city || extracted.city || undefined,
        country: extracted.address?.country || extracted.country || 'Deutschland',
      },
    };

    console.log('[Company Search] Extracted:', companyData);
    return companyData;
  } catch (error) {
    console.error('[Company Search] Error:', error);
    return null;
  }
}

/**
 * Simple HTTP fetch (for server-rendered sites)
 */
async function fetchWithSimpleRequest(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LiqiNow-Bot/1.0)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[Company Search] Simple fetch failed: ${response.status}`);
      return null;
    }

    const html = await response.text();
    console.log(`[Company Search] Simple fetch returned ${html.length} chars`);
    return html;
  } catch (error) {
    console.error('[Company Search] Simple fetch error:', error);
    return null;
  }
}

function findImpressumUrl(html: string, baseUrl: string): string | null {
  const patterns = [
    /<a[^>]*href=["']([^"']*impressum[^"']*)["'][^>]*>/gi,
    /<a[^>]*href=["']([^"']*imprint[^"']*)["'][^>]*>/gi,
    /<a[^>]*href=["']([^"']*legal[^"']*)["'][^>]*>/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match && match[1]) {
      let url = match[1];

      if (url.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        url = `${urlObj.protocol}//${urlObj.host}${url}`;
      } else if (!url.startsWith('http')) {
        const urlObj = new URL(baseUrl);
        url = `${urlObj.protocol}//${urlObj.host}/${url}`;
      }

      return url;
    }
  }

  return null;
}

function extractRelevantText(html: string): string {
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  text = text.replace(/style="[^"]*"/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/ +/g, ' ');
  text = text.replace(/\n +/g, '\n');
  text = text.replace(/ +\n/g, '\n');
  text = text.replace(/\n\n+/g, '\n\n');
  text = text.trim();

  const keywords = [
    'umsatzsteuer-identifikationsnummer',
    'umsatzsteuer',
    'ust-id',
    'handelsregister',
    'registernummer',
    'geschäftsführer',
    'vertreten durch',
    'amtsgericht',
    'anschrift',
    'adresse',
    'straße',
    'str.',
  ];

  let bestIndex = -1;
  const lowerText = text.toLowerCase();

  for (const keyword of keywords) {
    const index = lowerText.indexOf(keyword);
    if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
      bestIndex = index;
    }
  }

  if (bestIndex !== -1) {
    const start = Math.max(0, bestIndex - 600);
    const end = Math.min(text.length, bestIndex + 2500);
    text = text.substring(start, end);
  } else {
    const impressumIndex = lowerText.indexOf('impressum');
    if (impressumIndex !== -1) {
      const start = Math.max(0, impressumIndex);
      const end = Math.min(text.length, start + 3000);
      text = text.substring(start, end);
    } else {
      text = text.substring(0, Math.min(3000, text.length));
    }
  }

  return text;
}

function createExtractionPrompt(content: string, website: string): string {
  return `
Du bist ein Experte für das Extrahieren von Unternehmensdaten aus Impressum-Texten.

TEXT VON ${website}:
${content}

AUFGABE:
Extrahiere folgende Firmendaten aus dem Text oben:

1. **Firmenname**: Der vollständige offizielle Firmenname (z.B. "Beispiel GmbH", "Muster AG")
2. **USt-ID**: Umsatzsteuer-Identifikationsnummer im Format DE123456789 (11 Zeichen, beginnt mit DE)
3. **HRB**: Handelsregisternummer (z.B. "HRB 12345", "HRA 67890")
4. **Straße**: Straße mit Hausnummer (z.B. "Musterstraße 123")
5. **PLZ**: Postleitzahl (5 Ziffern)
6. **Stadt**: Stadtname
7. **Land**: Land (Standard: "Deutschland")

WICHTIGE HINWEISE:
- Suche nach Schlüsselwörtern wie "Umsatzsteuer-Identifikationsnummer", "USt-ID", "DE" gefolgt von 9 Ziffern
- Suche nach "Registernummer", "HRB", "HRA" für Handelsregisternummer
- Suche nach 5-stelligen Postleitzahlen gefolgt von Stadtnamen
- Wenn eine Information nicht gefunden wird: setze null (nicht "nicht gefunden" oder leer)
- ERFINDE KEINE DATEN - nur extrahieren was wirklich da steht

ANTWORTFORMAT (nur valides JSON):
{
  "name": "Firmenname oder null",
  "ustId": "DE123456789 oder null",
  "hrb": "HRB 12345 oder null",
  "address": {
    "street": "Straße Hausnr. oder null",
    "zip": "12345 oder null",
    "city": "Stadt oder null",
    "country": "Deutschland"
  }
}
`.trim();
}
