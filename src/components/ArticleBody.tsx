"use client";

import React from "react";
import ArticleCTA from "./ArticleCTA";

type BodyImage = { url: string; alt: string; caption?: string };

type Props = {
  /** Article HTML containing [[IMG_1]], [[IMG_2]], [[IMG_3]], [[CTA]] placeholders */
  html: string;
  bodyImages: BodyImage[];
  articleSlug: string;
  /** When true (admin preview), CTA renders but click is NOT tracked */
  preview?: boolean;
};

const PLACEHOLDER_RE = /\[\[(IMG_(?:1|2|3)|CTA)\]\]/g;

/**
 * Renders article HTML with deterministic placeholder substitution:
 *   [[IMG_1]] / [[IMG_2]] / [[IMG_3]] → <figure><img/><figcaption/></figure>
 *   [[CTA]]                            → <ArticleCTA/>
 *
 * The HTML between placeholders is rendered via dangerouslySetInnerHTML.
 * Components are React-rendered so tracking + future interactivity work.
 */
export default function ArticleBody({ html, bodyImages, articleSlug, preview = false }: Props) {
  const segments = React.useMemo(() => {
    const result: Array<{ type: "html" | "img" | "cta"; data: string | BodyImage; key: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    PLACEHOLDER_RE.lastIndex = 0;

    while ((match = PLACEHOLDER_RE.exec(html)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: "html", data: html.slice(lastIndex, match.index), key: `h-${lastIndex}` });
      }
      const token = match[1];
      if (token.startsWith("IMG_")) {
        const idx = parseInt(token.slice(4), 10) - 1;
        const img = bodyImages[idx];
        if (img) result.push({ type: "img", data: img, key: `i-${idx}-${match.index}` });
      } else if (token === "CTA") {
        result.push({ type: "cta", data: "", key: `c-${match.index}` });
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < html.length) {
      result.push({ type: "html", data: html.slice(lastIndex), key: `h-${lastIndex}-end` });
    }
    return result;
  }, [html, bodyImages]);

  return (
    <div className="article-body">
      {segments.map((seg) => {
        if (seg.type === "html") {
          return <div key={seg.key} dangerouslySetInnerHTML={{ __html: seg.data as string }} />;
        }
        if (seg.type === "img") {
          const img = seg.data as BodyImage;
          return (
            <figure key={seg.key} className="my-8">
              <img src={img.url} alt={img.alt} loading="lazy"
                   className="w-full rounded-2xl object-cover" />
              {img.caption && (
                <figcaption className="mt-2 text-xs text-subtle text-center italic">{img.caption}</figcaption>
              )}
            </figure>
          );
        }
        if (seg.type === "cta") {
          if (preview) {
            // Static preview in admin — no tracking, no Link interactivity
            return (
              <aside key={seg.key} className="my-10 rounded-2xl bg-gradient-to-br from-[#9BAA28] to-[#C4D42B] p-6 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold mb-1">In 3 Minuten zum passenden Angebot</h3>
                    <p className="text-sm text-white/90">CTA-Komponente — wird live mit Tracking gerendert</p>
                  </div>
                  <span className="px-4 py-2 rounded-xl bg-white/20 text-sm font-medium">[[CTA]]</span>
                </div>
              </aside>
            );
          }
          return <ArticleCTA key={seg.key} articleSlug={articleSlug} position="mid_article" />;
        }
        return null;
      })}
    </div>
  );
}
