// Frontend-SDK für workflow-rules-admin + workflow-suggest.

import { createClient } from "@/lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function authHeader(): Promise<HeadersInit> {
  const { data } = await createClient().auth.getSession();
  const token = data.session?.access_token;
  return { "content-type": "application/json", apikey: ANON, ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

async function callFn(name: string, body: unknown): Promise<any> {
  const headers = await authHeader();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).error || (await res.text()); } catch {}
    throw new Error(detail || `${name} failed (${res.status})`);
  }
  return res.json();
}

// ----- Types -----
export type EntityType = "inquiries" | "applications" | "users";
export type TriggerType = "record_created" | "time_based";
export type ConditionOperator =
  | "equals" | "not_equals" | "contains" | "not_contains" | "is_null" | "is_not_null"
  | "greater_than" | "less_than" | "greater_than_or_equal" | "less_than_or_equal";

export type Condition = { field: string; operator: ConditionOperator; value?: string };
export type ConditionGroup = { match_type: "all" | "any"; conditions: Condition[] };

export type TimeConfig =
  | { type: "days_in_status"; status_field: string; status_value: string; days: number }
  | { type: "days_after_field"; field: string; days: number };

export type WorkflowAction = {
  action_type: "send_email";
  config: {
    template_slug: string;
    recipient_type: "entity_email" | "custom" | "operations_team";
    custom_email?: string;
    needs_template_creation?: boolean;
  };
};

export type WorkflowRule = {
  id?: string;
  name: string;
  description?: string;
  is_active: boolean;
  entity_type: EntityType;
  trigger_type: TriggerType;
  time_config?: TimeConfig | null;
  conditions: ConditionGroup;
  actions: WorkflowAction[];
  created_at?: string;
  updated_at?: string;
};

export type WorkflowExecution = {
  id: string;
  rule_id: string;
  entity_type: string;
  entity_id: string;
  /** ID die im /admin/anfragen?id=<…> Detail-View funktioniert (inquiry_id oder user_id) */
  link_id: string | null;
  status: "success" | "failure" | "skipped";
  error_message: string | null;
  matched_conditions: ConditionGroup;
  executed_actions: unknown;
  executed_at: string;
  rule?: { name: string; entity_type: string };
};

export type SentEmail = {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  status: "queued" | "sending" | "sent" | "failed" | "bounced";
  error_message: string | null;
  trigger_kind: "workflow" | "manual" | "test" | "transactional";
  template_slug: string | null;
  sent_at: string;
  entity_type?: string;
  entity_id?: string;
  link_id?: string | null;
};

// ----- Rules -----
export async function listWorkflowRules(): Promise<WorkflowRule[]> {
  const r = await callFn("workflow-rules-admin", { resource: "rule", action: "list" });
  return r.rules || [];
}
export async function getWorkflowRule(id: string): Promise<WorkflowRule | null> {
  const r = await callFn("workflow-rules-admin", { resource: "rule", action: "get", data: { id } });
  return r.rule ?? null;
}
export async function upsertWorkflowRule(rule: WorkflowRule): Promise<WorkflowRule> {
  const r = await callFn("workflow-rules-admin", { resource: "rule", action: "upsert", data: rule });
  return r.rule;
}
export async function toggleWorkflowRule(id: string): Promise<WorkflowRule> {
  const r = await callFn("workflow-rules-admin", { resource: "rule", action: "toggle", data: { id } });
  return r.rule;
}
export async function deleteWorkflowRule(id: string): Promise<void> {
  await callFn("workflow-rules-admin", { resource: "rule", action: "delete", data: { id } });
}
export async function runTimeBasedNow(): Promise<unknown> {
  const r = await callFn("workflow-rules-admin", { resource: "rule", action: "run_now" });
  return r.result;
}

// ----- Executions -----
export async function listWorkflowExecutions(): Promise<WorkflowExecution[]> {
  const r = await callFn("workflow-rules-admin", { resource: "execution", action: "list" });
  return r.executions || [];
}

// ----- Sent Emails -----
export async function listSentEmailsForEntity(entity_type: string, entity_id: string): Promise<SentEmail[]> {
  const r = await callFn("workflow-rules-admin", {
    resource: "sent_email", action: "list_by_entity",
    data: { entity_type, entity_id },
  });
  return r.sent_emails || [];
}
export async function listRecentSentEmails(): Promise<SentEmail[]> {
  const r = await callFn("workflow-rules-admin", { resource: "sent_email", action: "list_recent" });
  return r.sent_emails || [];
}

// ----- AI Suggest -----
export async function suggestWorkflowRule(description: string): Promise<WorkflowRule & { reasoning?: string }> {
  const r = await callFn("workflow-suggest", { description });
  return { is_active: true, ...r.rule };
}
