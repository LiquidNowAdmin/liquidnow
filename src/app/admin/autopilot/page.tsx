"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Trash2, Power, Pencil, Copy, Mail, Clock, Zap, ChevronRight, Play, ExternalLink } from "lucide-react";
import {
  listWorkflowRules, listWorkflowExecutions, listRecentSentEmails,
  toggleWorkflowRule, deleteWorkflowRule, runTimeBasedNow, upsertWorkflowRule,
  type WorkflowRule, type WorkflowExecution, type SentEmail,
} from "@/lib/workflow-rules-admin";
import RuleBuilder from "./components/RuleBuilder";

type Tab = "rules" | "executions" | "sent";

export default function AutopilotPage() {
  const [tab, setTab] = useState<Tab>("rules");
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<WorkflowRule | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [runningTime, setRunningTime] = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      if (tab === "rules") setRules(await listWorkflowRules());
      else if (tab === "executions") setExecutions(await listWorkflowExecutions());
      else setSentEmails(await listRecentSentEmails());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const onSaved = () => { setShowBuilder(false); setEditing(null); load(); };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark inline-flex items-center gap-2">
            <Zap className="w-6 h-6 text-turquoise" /> Automatisierung
          </h1>
          <p className="text-sm text-subtle">Regeln für automatisierte E-Mails — record_created &amp; zeitgesteuert</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {tab === "rules" && (
            <>
              <button onClick={async () => { setRunningTime(true); try { await runTimeBasedNow(); load(); } finally { setRunningTime(false); } }}
                      disabled={runningTime}
                      className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center gap-1.5">
                {runningTime ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Time-Based jetzt ausführen
              </button>
              <button onClick={() => { setEditing(null); setShowBuilder(true); }}
                      className="px-4 py-2 rounded-lg bg-turquoise hover:bg-turquoise-dark text-white text-sm font-semibold inline-flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Neue Rule
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {(["rules", "executions", "sent"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                    tab === t ? "text-turquoise border-turquoise" : "text-subtle border-transparent hover:text-dark"
                  }`}>
            {t === "rules" ? "Rules" : t === "executions" ? "Ausführungen" : "Versendete E-Mails"}
          </button>
        ))}
      </div>

      {error && <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      {tab === "rules" && (
        <RulesTab
          rules={rules}
          loading={loading}
          onEdit={(r) => { setEditing(r); setShowBuilder(true); }}
          onToggle={async (r) => { await toggleWorkflowRule(r.id!); load(); }}
          onDelete={async (r) => { if (confirm(`Rule "${r.name}" löschen?`)) { await deleteWorkflowRule(r.id!); load(); } }}
          onDuplicate={async (r) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, created_at, updated_at, ...rest } = r;
            await upsertWorkflowRule({ ...rest, name: `${r.name} (Kopie)`, is_active: false });
            load();
          }}
        />
      )}
      {tab === "executions" && <ExecutionsTab executions={executions} />}
      {tab === "sent" && <SentEmailsTab sentEmails={sentEmails} />}

      {showBuilder && (
        <RuleBuilder
          initial={editing ?? undefined}
          onClose={() => { setShowBuilder(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function RulesTab({
  rules, loading, onEdit, onToggle, onDelete, onDuplicate,
}: {
  rules: WorkflowRule[];
  loading: boolean;
  onEdit: (r: WorkflowRule) => void;
  onToggle: (r: WorkflowRule) => Promise<void>;
  onDelete: (r: WorkflowRule) => Promise<void>;
  onDuplicate: (r: WorkflowRule) => Promise<void>;
}) {
  if (loading && rules.length === 0) return <div className="p-12 text-center text-subtle">Lade…</div>;
  if (rules.length === 0) return (
    <div className="p-12 rounded-xl border border-dashed border-gray-200 text-center text-sm text-subtle">
      Noch keine Workflow-Rules. Lege eine an oder lass die KI dir helfen.
    </div>
  );
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-subtle">
          <tr>
            <th className="text-left px-4 py-3">Name</th>
            <th className="text-left px-4 py-3">Entity</th>
            <th className="text-left px-4 py-3">Trigger</th>
            <th className="text-left px-4 py-3">Actions</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-right px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-dark">{r.name}</div>
                {r.description && <div className="text-xs text-subtle">{r.description}</div>}
              </td>
              <td className="px-4 py-3 text-subtle">{r.entity_type}</td>
              <td className="px-4 py-3 text-subtle text-xs inline-flex items-center gap-1 mt-3">
                {r.trigger_type === "record_created" ? <><Zap className="w-3 h-3" /> erstellt</> : <><Clock className="w-3 h-3" /> zeit­basiert</>}
              </td>
              <td className="px-4 py-3 text-xs text-subtle">
                {r.actions.map((a, i) => <span key={i} className="inline-flex items-center gap-0.5 mr-2"><Mail className="w-3 h-3" />{a.config.template_slug}</span>)}
              </td>
              <td className="px-4 py-3">
                {r.is_active ? (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Aktiv</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">Pausiert</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex gap-1">
                  <button onClick={() => onToggle(r)} className="p-1.5 rounded hover:bg-gray-100" title={r.is_active ? "Pausieren" : "Aktivieren"}>
                    <Power className={`w-4 h-4 ${r.is_active ? "text-green-600" : "text-subtle"}`} />
                  </button>
                  <button onClick={() => onDuplicate(r)} className="p-1.5 rounded hover:bg-gray-100" title="Duplizieren">
                    <Copy className="w-4 h-4 text-subtle" />
                  </button>
                  <button onClick={() => onEdit(r)} className="p-1.5 rounded hover:bg-gray-100" title="Bearbeiten">
                    <Pencil className="w-4 h-4 text-subtle" />
                  </button>
                  <button onClick={() => onDelete(r)} className="p-1.5 rounded hover:bg-red-50" title="Löschen">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ENTITY_LABEL: Record<string, string> = {
  inquiries: "Anfrage",
  applications: "Bank-Antrag",
  users: "User",
  companies: "Firma",
};

function EntityLink({ entityType, entityId, linkId }: {
  entityType: string | null;
  entityId: string | null;
  linkId: string | null | undefined;
}) {
  if (!entityType || !entityId) return <span className="text-xs text-subtle">—</span>;
  const label = ENTITY_LABEL[entityType] ?? entityType;
  const target = linkId ?? entityId;
  // Detail-View versteht inquiry_id und user_id direkt; für applications wird
  // der Sender bei der Listung schon auf inquiry_id resolved (link_id).
  if (entityType === "applications" && !linkId) {
    // Fallback: keine Verlinkung wenn wir die inquiry_id nicht resolven konnten
    return (
      <span className="text-xs text-subtle">
        {label} · {entityId.slice(0, 8)}
      </span>
    );
  }
  return (
    <Link href={`/admin/anfragen?id=${encodeURIComponent(target)}`}
          className="inline-flex items-center gap-1 text-xs text-turquoise hover:text-turquoise-dark hover:underline">
      {label} · {target.slice(0, 8)}
      <ExternalLink className="w-3 h-3" />
    </Link>
  );
}

function ExecutionsTab({ executions }: { executions: WorkflowExecution[] }) {
  if (executions.length === 0) return (
    <div className="p-12 rounded-xl border border-dashed border-gray-200 text-center text-sm text-subtle">
      Noch keine Ausführungen. Sobald eine Rule feuert, erscheint sie hier.
    </div>
  );
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-subtle">
          <tr>
            <th className="text-left px-4 py-3">Zeit</th>
            <th className="text-left px-4 py-3">Rule</th>
            <th className="text-left px-4 py-3">Entity</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-left px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {executions.map((e) => (
            <tr key={e.id} className="border-t border-gray-100">
              <td className="px-4 py-3 text-xs text-subtle whitespace-nowrap">{new Date(e.executed_at).toLocaleString("de-DE")}</td>
              <td className="px-4 py-3 text-dark">{e.rule?.name ?? e.rule_id}</td>
              <td className="px-4 py-3">
                <EntityLink entityType={e.entity_type} entityId={e.entity_id} linkId={e.link_id} />
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  e.status === "success" ? "bg-green-100 text-green-700" :
                  e.status === "failure" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"
                }`}>{e.status}</span>
              </td>
              <td className="px-4 py-3 text-xs text-subtle font-mono">
                {Array.isArray(e.executed_actions) ? (e.executed_actions as Array<{ status: string; action_type: string }>).map((a, i) =>
                  <span key={i} className="mr-2">{a.action_type}: {a.status}</span>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SentEmailsTab({ sentEmails }: { sentEmails: SentEmail[] }) {
  if (sentEmails.length === 0) return (
    <div className="p-12 rounded-xl border border-dashed border-gray-200 text-center text-sm text-subtle">
      Noch keine E-Mails verschickt.
    </div>
  );
  const KIND_BADGE: Record<string, string> = {
    workflow:      "bg-purple-100 text-purple-700",
    manual:        "bg-blue-100 text-blue-700",
    test:          "bg-amber-100 text-amber-700",
    transactional: "bg-gray-100 text-gray-700",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-subtle">
          <tr>
            <th className="text-left px-4 py-3">Zeit</th>
            <th className="text-left px-4 py-3">Empfänger</th>
            <th className="text-left px-4 py-3">Betreff</th>
            <th className="text-left px-4 py-3">Bezug</th>
            <th className="text-left px-4 py-3">Quelle</th>
            <th className="text-left px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {sentEmails.map((e) => (
            <tr key={e.id} className="border-t border-gray-100">
              <td className="px-4 py-3 text-xs text-subtle whitespace-nowrap">{new Date(e.sent_at).toLocaleString("de-DE")}</td>
              <td className="px-4 py-3 text-dark">{e.recipient_email}</td>
              <td className="px-4 py-3 text-subtle truncate max-w-[20rem]">{e.subject}</td>
              <td className="px-4 py-3">
                <EntityLink entityType={e.entity_type ?? null} entityId={e.entity_id ?? null} linkId={e.link_id} />
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${KIND_BADGE[e.trigger_kind] ?? "bg-gray-100"}`}>
                  {e.trigger_kind}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  e.status === "sent" ? "bg-green-100 text-green-700" :
                  e.status === "failed" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"
                }`}>{e.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
