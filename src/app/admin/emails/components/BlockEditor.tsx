"use client";

import { useState } from "react";
import {
  Trash2, ArrowUp, ArrowDown, Plus, Type, Heading2, MousePointerClick,
  Minus, Image as ImageIcon, List as ListIcon, Quote as QuoteIcon, Space, Sparkles,
} from "lucide-react";
import type { Block } from "@/lib/email-renderer";
import { VARIABLES } from "@/lib/email-renderer";

type Props = {
  blocks: Block[];
  onChange: (next: Block[]) => void;
};

const BLOCK_OPTIONS: Array<{ type: Block["type"]; label: string; icon: React.ComponentType<{ className?: string }>; create: () => Block }> = [
  { type: "paragraph", label: "Absatz",       icon: Type,                create: () => ({ type: "paragraph", text: "" }) },
  { type: "heading",   label: "Überschrift",  icon: Heading2,            create: () => ({ type: "heading", level: 2, text: "" }) },
  { type: "button",    label: "Button (CTA)", icon: MousePointerClick,   create: () => ({ type: "button", label: "Jetzt vergleichen", url: "https://liqinow.de/plattform" }) },
  { type: "list",      label: "Liste",        icon: ListIcon,            create: () => ({ type: "list", ordered: false, items: ["", ""] }) },
  { type: "quote",     label: "Zitat",        icon: QuoteIcon,           create: () => ({ type: "quote", text: "" }) },
  { type: "image",     label: "Bild",         icon: ImageIcon,           create: () => ({ type: "image", url: "", alt: "" }) },
  { type: "divider",   label: "Trennlinie",   icon: Minus,               create: () => ({ type: "divider" }) },
  { type: "spacer",    label: "Abstand",      icon: Space,               create: () => ({ type: "spacer", size: "md" }) },
];

export default function BlockEditor({ blocks, onChange }: Props) {
  const update = (i: number, patch: Partial<Block>) => {
    const next = [...blocks];
    next[i] = { ...next[i], ...patch } as Block;
    onChange(next);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => onChange(blocks.filter((_, k) => k !== i));
  const insert = (i: number, b: Block) => {
    const next = [...blocks];
    next.splice(i, 0, b);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <div className="p-6 rounded-xl border border-dashed border-gray-200 text-center text-sm text-subtle">
          Noch keine Inhalts-Blöcke. Füge unten einen ein.
        </div>
      )}

      {blocks.map((b, i) => (
        <div key={i}>
          <BlockCard
            block={b}
            onUpdate={(patch) => update(i, patch)}
            onUp={i > 0 ? () => move(i, -1) : undefined}
            onDown={i < blocks.length - 1 ? () => move(i, 1) : undefined}
            onRemove={() => remove(i)}
          />
          <InsertRow onInsert={(b) => insert(i + 1, b)} />
        </div>
      ))}

      {blocks.length === 0 && <InsertRow onInsert={(b) => insert(0, b)} />}
    </div>
  );
}

function InsertRow({ onInsert }: { onInsert: (b: Block) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative my-1">
      <div className="flex items-center justify-center">
        <button
          onClick={() => setOpen(!open)}
          className="px-3 py-1 rounded-full border border-dashed border-gray-300 bg-white hover:border-turquoise hover:text-turquoise text-xs text-subtle inline-flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" /> Block einfügen
        </button>
      </div>
      {open && (
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
          {BLOCK_OPTIONS.map((o) => (
            <button
              key={o.type}
              onClick={() => { onInsert(o.create()); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-turquoise hover:text-white text-sm text-dark border border-gray-200 hover:border-turquoise transition-colors"
            >
              <o.icon className="w-4 h-4" /> {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockCard({
  block, onUpdate, onUp, onDown, onRemove,
}: {
  block: Block;
  onUpdate: (p: Partial<Block>) => void;
  onUp?: () => void;
  onDown?: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-[10px] uppercase tracking-wide font-semibold text-subtle">{block.type}</span>
        <div className="inline-flex gap-0.5">
          {onUp && <button onClick={onUp} className="p-1 rounded hover:bg-gray-200" title="Nach oben"><ArrowUp className="w-3.5 h-3.5 text-subtle" /></button>}
          {onDown && <button onClick={onDown} className="p-1 rounded hover:bg-gray-200" title="Nach unten"><ArrowDown className="w-3.5 h-3.5 text-subtle" /></button>}
          <button onClick={onRemove} className="p-1 rounded hover:bg-red-50" title="Löschen"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
        </div>
      </div>
      <div className="p-3">
        <BlockBody block={block} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

function BlockBody({ block, onUpdate }: { block: Block; onUpdate: (p: Partial<Block>) => void }) {
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <label className="text-xs text-subtle">Level</label>
            <select value={block.level} onChange={(e) => onUpdate({ level: parseInt(e.target.value) as 1 | 2 } as never)}
                    className="px-2 py-1 rounded border border-gray-200 text-sm">
              <option value={1}>H1</option>
              <option value={2}>H2</option>
            </select>
          </div>
          <TextWithVariablePicker value={block.text} onChange={(text) => onUpdate({ text } as never)} placeholder="Überschrift" />
        </div>
      );
    case "paragraph":
      return <TextWithVariablePicker value={block.text} onChange={(text) => onUpdate({ text } as never)} multiline placeholder="Text…" />;
    case "button":
      return (
        <div className="grid gap-2 md:grid-cols-2">
          <input value={block.label} onChange={(e) => onUpdate({ label: e.target.value } as never)}
                 placeholder="Button-Text"
                 className="px-3 py-2 rounded border border-gray-200 text-sm" />
          <input value={block.url} onChange={(e) => onUpdate({ url: e.target.value } as never)}
                 placeholder="https://..."
                 className="px-3 py-2 rounded border border-gray-200 text-sm font-mono" />
        </div>
      );
    case "divider":
      return <p className="text-xs text-subtle italic">Horizontale Trennlinie</p>;
    case "spacer":
      return (
        <div className="flex gap-2 items-center">
          <label className="text-xs text-subtle">Größe</label>
          <select value={block.size} onChange={(e) => onUpdate({ size: e.target.value } as never)}
                  className="px-2 py-1 rounded border border-gray-200 text-sm">
            <option value="sm">Klein</option>
            <option value="md">Mittel</option>
            <option value="lg">Groß</option>
          </select>
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <input value={block.url} onChange={(e) => onUpdate({ url: e.target.value } as never)}
                 placeholder="Bild-URL (https://images.pexels.com/...)"
                 className="w-full px-3 py-2 rounded border border-gray-200 text-sm font-mono" />
          <input value={block.alt} onChange={(e) => onUpdate({ alt: e.target.value } as never)}
                 placeholder="Alt-Text"
                 className="w-full px-3 py-2 rounded border border-gray-200 text-sm" />
          <input value={block.caption ?? ""} onChange={(e) => onUpdate({ caption: e.target.value } as never)}
                 placeholder="Bildunterschrift (optional)"
                 className="w-full px-3 py-2 rounded border border-gray-200 text-sm" />
        </div>
      );
    case "list":
      return (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-dark">
            <input type="checkbox" checked={block.ordered}
                   onChange={(e) => onUpdate({ ordered: e.target.checked } as never)} />
            Nummerierte Liste
          </label>
          {block.items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <input value={it} onChange={(e) => {
                const items = [...block.items]; items[i] = e.target.value; onUpdate({ items } as never);
              }}
                placeholder={`Punkt ${i + 1}`}
                className="flex-1 px-3 py-2 rounded border border-gray-200 text-sm" />
              <button onClick={() => onUpdate({ items: block.items.filter((_, k) => k !== i) } as never)}
                      className="p-2 rounded hover:bg-red-50">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
          <button onClick={() => onUpdate({ items: [...block.items, ""] } as never)}
                  className="text-xs text-turquoise hover:text-turquoise-dark inline-flex items-center gap-1">
            <Plus className="w-3 h-3" /> Punkt hinzufügen
          </button>
        </div>
      );
    case "quote":
      return (
        <div className="space-y-2">
          <TextWithVariablePicker value={block.text} onChange={(text) => onUpdate({ text } as never)} multiline placeholder="Zitat…" />
          <input value={block.attribution ?? ""} onChange={(e) => onUpdate({ attribution: e.target.value } as never)}
                 placeholder="Quelle/Person (optional)"
                 className="w-full px-3 py-2 rounded border border-gray-200 text-sm" />
        </div>
      );
  }
}

function TextWithVariablePicker({
  value, onChange, multiline, placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const insert = (key: string) => {
    onChange((value || "") + `{{${key}}}`);
    setOpen(false);
  };

  const Field = multiline ? "textarea" : "input";

  return (
    <div className="space-y-1">
      <Field
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)}
        rows={multiline ? 4 : undefined}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded border border-gray-200 text-sm"
      />
      <div className="relative">
        <button type="button" onClick={() => setOpen(!open)}
                className="text-xs text-subtle hover:text-turquoise inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Variable einfügen
        </button>
        {open && (
          <div className="absolute z-10 mt-1 w-80 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insert(v.key)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="text-xs font-mono text-turquoise">{`{{${v.key}}}`}</div>
                <div className="text-xs text-subtle">{v.label} · z. B. „{v.example}"</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
