"use client";

import { useEffect, useRef } from "react";
import type { Block } from "@/lib/email-renderer";
import { renderEmail, exampleVariableValues } from "@/lib/email-renderer";

type Props = {
  blocks: Block[];
  type: "newsletter" | "transactional";
  preheader?: string;
};

export default function EmailPreview({ blocks, type, preheader }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const { html } = renderEmail({ blocks, type, preheader, values: exampleVariableValues() });
    const iframe = ref.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  }, [blocks, type, preheader]);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-subtle">
        Vorschau (mit Beispiel-Variablen, Footer ist Pflicht und automatisch)
      </div>
      <iframe
        ref={ref}
        title="Email-Vorschau"
        sandbox="allow-same-origin"
        className="w-full h-[700px] bg-[#F3F6F9]"
      />
    </div>
  );
}
