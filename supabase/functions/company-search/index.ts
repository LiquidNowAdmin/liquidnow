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

// CORS allowed origins
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://liquidnow.de',
  'https://www.liquidnow.de',
  'https://liquidnow.de.s3-website.nl-ams.scw.cloud',
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

    // Fetch website with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let websiteResponse: Response;
    try {
      websiteResponse = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LiquidNow-Bot/1.0)',
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!websiteResponse.ok) {
      console.error(`[Company Search] Failed to fetch: ${websiteResponse.status}`);
      return null;
    }

    let html = await websiteResponse.text();
    console.log(`[Company Search] Fetched ${html.length} chars`);

    // Try to find and fetch Impressum page
    const impressumUrl = findImpressumUrl(html, normalizedUrl);
    if (impressumUrl) {
      console.log(`[Company Search] Found Impressum: ${impressumUrl}`);
      try {
        const impressumResponse = await fetch(impressumUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LiquidNow-Bot/1.0)',
          },
        });

        if (impressumResponse.ok) {
          html = await impressumResponse.text();
          console.log(`[Company Search] Fetched Impressum: ${html.length} chars`);
        }
      } catch (error) {
        console.log('[Company Search] Failed to fetch Impressum, using main page');
      }
    }

    // Extract relevant text
    const cleanText = extractRelevantText(html);

    if (!cleanText || cleanText.length < 100) {
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

function findImpressumUrl(html: string, baseUrl: string): string | null {
  const lowerHtml = html.toLowerCase();

  const patterns = [
    /<a[^>]*href=["']([^"']*impressum[^"']*)["'][^>]*>/gi,
    /<a[^>]*href=["']([^"']*imprint[^"']*)["'][^>]*>/gi,
    /<a[^>]*href=["']([^"']*legal[^"']*)["'][^>]*>/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(lowerHtml);
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
    const start = Math.max(0, bestIndex - 300);
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
