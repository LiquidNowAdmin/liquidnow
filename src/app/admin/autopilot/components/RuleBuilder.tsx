"use client";

import { useEffect, useState } from "react";
import { X, Save, Sparkles, Loader2, Plus, Trash2 } from "lucide-react";
import {
  upsertWorkflowRule, suggestWorkflowRule,
  type WorkflowRule, type Condition, type ConditionOperator,
  type EntityType, type TriggerType,
} from "@/lib/workflow-rules-admin";
import { listEmailTemplates, type EmailTemplateListItem } from "@/lib/email-templates-admin";

const ENTITY_LABELS: Record<EntityType, string> = {
  inquiries: "Anfragen",
  applications: "Applications",
  users: "Users",
};

const ENTITY_FIELDS: Record<EntityType, string[]> = {
  inquiries:    ["status", "volume", "term_months", "purpose", "company_name", "created_at", "status_last_changed_at"],
  applications: ["status", "provider_name", "product_name", "volume", "term_months", "created_at", "status_last_changed_at"],
  users:        ["email", "role", "first_name", "last_name", "created_at"],
};

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: "ist gleich",
  not_equals: "ist nicht gleich",
  contains: "enthält",
  not_contains: "enthält nicht",
  is_null: "ist leer",
  is_not_null: "ist nicht leer",
  greater_than: "größer als",
  less_than: "kleiner als",
  greater_than_or_equal: "größer/gleich",
  less_than_or_equal: "kleiner/gleich",
};

const EMPTY: WorkflowRule = {
  name: "",
  description: "",
  is_active: true,
  entity_type: "inquiries",
  trigger_type: "record_created",
  time_config: null,
  conditions: { match_type: "all", conditions: [] },
  actions: [],
};

type Props = {
  initial?: WorkflowRule;
  onClose: () => void;
  onSaved: () => void;
};

export default function RuleBuilder({ initial, onClose, onSaved }: Props) {
  const [r, setR] = useState<WorkflowRule>(initial ?? EMPTY);
  const [templates, setTemplates] = useState<EmailTemplateListItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);

  useEffect(() => { listEmailTemplates().then(setTemplates).catch(() => {}); }, []);

  const update = <K extends keyof WorkflowRule>(k: K, v: WorkflowRule[K]) => setR((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!r.name.trim()) { setError("Name ist Pflicht"); return; }
    if (r.actions.length === 0) { setError("Mindestens eine Action"); return; }
    if (r.trigger_type === "time_based" && !r.time_config) { setError("Zeit-Konfiguration ist Pflicht"); return; }
    setBusy(true); setError(null);
    try { await upsertWorkflowRule(r); onSaved(); }
    catch (err) { setError(err instanceof Error ? err.message : "Fehler"); }
    finally { setBusy(false); }
  };

  const runAI = async () => {
    if (!aiDescription.trim()) return;
    setAiBusy(true); setError(null);
    try {
      const draft = await suggestWorkflowRule(aiDescription);
      const { reasoning, ...rest } = draft as WorkflowRule & { reasoning?: string };
      setR({
        ...EMPTY,
        ...rest,
        conditions: rest.conditions ?? EMPTY.conditions,
        actions: rest.actions ?? [],
        time_config: rest.time_config ?? null,
        is_active: rest.is_active ?? true,
      });
      setAiReasoning(reasoning ?? null);
      setAiOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "KI-Vorschlag fehlgeschlagen");
    } finally { setAiBusy(false); }
  };

  const fields = ENTITY_FIELDS[r.entity_type] || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-semibold text-dark">{initial?.id ? "Rule bearbeiten" : "Neue Workflow-Rule"}</h3>
          <div className="flex gap-2">
            <button onClick={() => setAiOpen(!aiOpen)} className="px-3 py-1.5 rounded-lg bg-dark text-white text-sm inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> KI-Vorschlag
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {aiOpen && (
          <div className="m-6 p-4 rounded-xl bg-turquoise-light border border-turquoise/20 space-y-3">
            <p className="text-sm text-dark">Beschreib in eigenen Worten was die Rule tun soll. Die KI baut dir einen Entwurf, den du danach editieren kannst.</p>
            <textarea value={aiDescription} onChange={(e) => setAiDescription(e.target.value)} rows={3}
                      placeholder='z. B. "Schicke 3 Tage nachdem eine Anfrage in Status `new` ist eine Erinnerungs-Mail an den Kunden."'
                      className="w-full px-3 py-2 rounded border border-gray-200 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setAiOpen(false)} className="text-sm text-subtle hover:text-dark">Abbrechen</button>
              <button onClick={runAI} disabled={aiBusy || !aiDescription.trim()}
                      className="px-4 py-1.5 rounded-lg bg-turquoise hover:bg-turquoise-dark text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50">
                {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Vorschlag generieren
              </button>
            </div>
          </div>
        )}

        {aiReasoning && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
            <strong>KI-Erklärung:</strong> {aiReasoning}
          </div>
        )}

        <div className="p-6 space-y-5">
          {error && <div className="p-2 rounded bg-red-50 text-red-700 text-sm">{error}</div>}

          {/* Basics */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Name *</label>
              <input value={r.name} onChange={(e) => update("name", e.target.value)}
                     className="w-full mt-1 px-3 py-2 rounded border border-gray-200" />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-dark mb-2">
                <input type="checkbox" checked={r.is_active} onChange={(e) => update("is_active", e.target.checked)} />
                Aktiv
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Beschreibung</label>
            <input value={r.description ?? ""} onChange={(e) => update("description", e.target.value)}
                   className="w-full mt-1 px-3 py-2 rounded border border-gray-200" />
          </div>

          {/* Entity + Trigger */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Entity *</label>
              <select value={r.entity_type}
                      onChange={(e) => update("entity_type", e.target.value as EntityType)}
                      className="w-full mt-1 px-3 py-2 rounded border border-gray-200">
                {(Object.keys(ENTITY_LABELS) as EntityType[]).map((k) => (
                  <option key={k} value={k}>{ENTITY_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-subtle font-semibold">Trigger *</label>
              <select value={r.trigger_type}
                      onChange={(e) => update("trigger_type", e.target.value as TriggerType)}
                      className="w-full mt-1 px-3 py-2 rounded border border-gray-200">
                <option value="record_created">Record erstellt</option>
                <option value="time_based">Zeitbasiert</option>
              </select>
            </div>
          </div>

          {r.trigger_type === "time_based" && (
            <TimeConfigForm
              value={r.time_config}
              onChange={(c) => update("time_config", c)}
              fields={fields}
            />
          )}

          {/* Conditions */}
          <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-wide text-subtle font-semibold">Conditions (optional)</h4>
              <select value={r.conditions.match_type}
                      onChange={(e) => update("conditions", { ...r.conditions, match_type: e.target.value as "all"|"any" })}
                      className="px-2 py-1 rounded border border-gray-200 text-xs">
                <option value="all">UND (alle)</option>
                <option value="any">ODER (mindestens eine)</option>
              </select>
            </div>
            {r.conditions.conditions.map((c, i) => (
              <ConditionRow key={i} condition={c} fields={fields}
                onChange={(next) => {
                  const list = [...r.conditions.conditions]; list[i] = next;
                  update("conditions", { ...r.conditions, conditions: list });
                }}
                onRemove={() => {
                  const list = r.conditions.conditions.filter((_, k) => k !== i);
                  update("conditions", { ...r.conditions, conditions: list });
                }} />
            ))}
            <button onClick={() => update("conditions", {
              ...r.conditions,
              conditions: [...r.conditions.conditions, { field: fields[0] ?? "", operator: "equals", value: "" }],
            })} className="text-xs text-turquoise hover:text-turquoise-dark inline-flex items-center gap-1 mt-2">
              <Plus className="w-3 h-3" /> Condition hinzufügen
            </button>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/50">
            <h4 className="text-xs uppercase tracking-wide text-subtle font-semibold mb-3">Actions *</h4>
            {r.actions.map((a, i) => (
              <ActionRow key={i} action={a} templates={templates}
                onChange={(next) => {
                  const list = [...r.actions]; list[i] = next; update("actions", list);
                }}
                onRemove={() => update("actions", r.actions.filter((_, k) => k !== i))} />
            ))}
            <button onClick={() => update("actions", [...r.actions, {
              action_type: "send_email",
              config: { template_slug: templates[0]?.slug ?? "", recipient_type: "entity_email" },
            }])} className="text-xs text-turquoise hover:text-turquoise-dark inline-flex items-center gap-1 mt-2">
              <Plus className="w-3 h-3" /> Email-Action hinzufügen
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-subtle hover:text-dark">Abbrechen</button>
          <button onClick={save} disabled={busy}
                  className="px-4 py-1.5 rounded-lg bg-turquoise hover:bg-turquoise-dark text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-1.5">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <Save className="w-3.5 h-3.5" /> Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

function TimeConfigForm({
  value, onChange, fields,
}: {
  value: WorkflowRule["time_config"];
  onChange: (next: WorkflowRule["time_config"]) => void;
  fields: string[];
}) {
  const t = value?.type ?? "days_in_status";
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/50 space-y-3">
      <h4 className="text-xs uppercase tracking-wide text-subtle font-semibold">Zeit-Konfiguration</h4>
      <select value={t}
              onChange={(e) => onChange(e.target.value === "days_in_status"
                ? { type: "days_in_status", status_field: "status", status_value: "", days: 1 }
                : { type: "days_after_field", field: "created_at", days: 1 })}
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm">
        <option value="days_in_status">Tage im Status</option>
        <option value="days_after_field">Tage nach Datums-Feld</option>
      </select>

      {t === "days_in_status" && value && "status_value" in value && (
        <div className="grid grid-cols-3 gap-2">
          <input value={value.status_field}
                 onChange={(e) => onChange({ ...value, status_field: e.target.value })}
                 placeholder="status_field" className="px-3 py-2 rounded border border-gray-200 text-sm" />
          <input value={value.status_value}
                 onChange={(e) => onChange({ ...value, status_value: e.target.value })}
                 placeholder="status_value" className="px-3 py-2 rounded border border-gray-200 text-sm" />
          <input type="number" value={value.days}
                 onChange={(e) => onChange({ ...value, days: parseInt(e.target.value) || 1 })}
                 placeholder="Tage" className="px-3 py-2 rounded border border-gray-200 text-sm" />
        </div>
      )}
      {t === "days_after_field" && value && "field" in value && (
        <div className="grid grid-cols-2 gap-2">
          <select value={value.field}
                  onChange={(e) => onChange({ ...value, field: e.target.value })}
                  className="px-3 py-2 rounded border border-gray-200 text-sm">
            {fields.filter((f) => f.endsWith("_at") || f.includes("date")).map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <input type="number" value={value.days}
                 onChange={(e) => onChange({ ...value, days: parseInt(e.target.value) || 1 })}
                 placeholder="Tage" className="px-3 py-2 rounded border border-gray-200 text-sm" />
        </div>
      )}
    </div>
  );
}

function ConditionRow({
  condition, fields, onChange, onRemove,
}: {
  condition: Condition;
  fields: string[];
  onChange: (next: Condition) => void;
  onRemove: () => void;
}) {
  const showValue = !["is_null", "is_not_null"].includes(condition.operator);
  return (
    <div className="flex gap-2 items-center mb-2">
      <select value={condition.field}
              onChange={(e) => onChange({ ...condition, field: e.target.value })}
              className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm">
        {fields.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
      <select value={condition.operator}
              onChange={(e) => onChange({ ...condition, operator: e.target.value as ConditionOperator })}
              className="px-2 py-1.5 rounded border border-gray-200 text-sm">
        {(Object.keys(OPERATOR_LABELS) as ConditionOperator[]).map((o) => (
          <option key={o} value={o}>{OPERATOR_LABELS[o]}</option>
        ))}
      </select>
      {showValue && (
        <input value={condition.value ?? ""} onChange={(e) => onChange({ ...condition, value: e.target.value })}
               placeholder="Wert" className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-sm" />
      )}
      <button onClick={onRemove} className="p-1.5 rounded hover:bg-red-50">
        <Trash2 className="w-3.5 h-3.5 text-red-500" />
      </button>
    </div>
  );
}

function ActionRow({
  action, templates, onChange, onRemove,
}: {
  action: WorkflowRule["actions"][number];
  templates: EmailTemplateListItem[];
  onChange: (next: WorkflowRule["actions"][number]) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 mb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-subtle font-semibold">E-Mail senden</span>
        <button onClick={onRemove} className="p-1 rounded hover:bg-red-50">
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-subtle uppercase">Template</label>
          {templates.length > 0 ? (
            <select value={action.config.template_slug}
                    onChange={(e) => onChange({ ...action, config: { ...action.config, template_slug: e.target.value } })}
                    className="w-full mt-1 px-2 py-1.5 rounded border border-gray-200 text-sm">
              {templates.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
          ) : (
            <input value={action.config.template_slug}
                   onChange={(e) => onChange({ ...action, config: { ...action.config, template_slug: e.target.value } })}
                   placeholder="template-slug"
                   className="w-full mt-1 px-2 py-1.5 rounded border border-gray-200 text-sm font-mono" />
          )}
          {action.config.needs_template_creation && (
            <p className="text-[10px] text-amber-700 mt-1">⚠️ Template muss noch in /admin/emails angelegt werden.</p>
          )}
        </div>
        <div>
          <label className="text-[10px] text-subtle uppercase">Empfänger</label>
          <select value={action.config.recipient_type}
                  onChange={(e) => onChange({ ...action, config: { ...action.config, recipient_type: e.target.value as "entity_email" | "custom" | "operations_team" } })}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-gray-200 text-sm">
            <option value="entity_email">Entity-E-Mail (Kunde)</option>
            <option value="operations_team">Ops-Team (alle role=operations)</option>
            <option value="custom">Custom (feste Adresse)</option>
          </select>
        </div>
      </div>
      {action.config.recipient_type === "custom" && (
        <input value={action.config.custom_email ?? ""}
               onChange={(e) => onChange({ ...action, config: { ...action.config, custom_email: e.target.value } })}
               placeholder="z. B. team@liqinow.de"
               className="w-full mt-2 px-2 py-1.5 rounded border border-gray-200 text-sm" />
      )}
    </div>
  );
}
