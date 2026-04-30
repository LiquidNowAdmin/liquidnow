-- Body-Bilder + CTA-Platzhalter für Ratgeber-Artikel.
-- body_images ist ein Array {url, alt, caption?}.
-- Platzhalter [[IMG_1]], [[IMG_2]], [[IMG_3]], [[CTA]] werden im content-HTML gesetzt
-- und vom Frontend durch echte Komponenten ersetzt.

alter table articles
  add column body_images jsonb not null default '[]'::jsonb;
