// =============================================================================
// services/chatwoot-parser.ts
// Parser functions — transform raw Chatwoot data ke format DB
//
// Functions:
// - parseLabels      : Extract service, priority, escalate, type dari labels
// - parseFrt         : Hitung First Response Time
// - parseResolutionTime: Hitung Resolution Time
// - parseResolveCount: Hitung berapa kali conversation di-resolve
// - parseLastNote    : Ambil last private note
// - parseCustomerInfo: Ambil info customer dari meta.sender
// - buildConversation: Gabungkan semua data jadi 1 object siap simpan ke DB
// =============================================================================

import type { ChatwootConversation, ChatwootMessage } from "./chatwoot";

// ===========================================================================
// TYPE MAPPING — label 10_xxx → display name
// Sama persis dengan TYPE_MAPPING di project lama
// ===========================================================================
const TYPE_MAPPING: Record<string, string> = {
  bug              : "Bug",
  he               : "Human Error",
  others_issue     : "Others Issue",
  question         : "Question",
  req              : "Request",
  system_code_issue: "System/Code Issue",
};

// ===========================================================================
// PARSE LABELS — Extract info dari array labels Chatwoot
// Label conventions:
// - 2_xxx  → service (contoh: 2_billing → "Billing")
// - p1/p2/p3/p4 → priority
// - l1/l2       → escalate level
// - 10_xxx      → type (pakai TYPE_MAPPING)
// ===========================================================================
export function parseLabels(labels: string[]): {
  service  : string | null;
  priority : string | null;
  escalate : string | null;
  type     : string | null;
  rawLabels: string;
  company  : string | null;
} {
  let service  : string | null = null;
  let priority : string | null = null;
  let escalate : string | null = null;
  let type     : string | null = null;
  let company  : string | null = null;

  const rawLabels = labels.join(", ");

  for (const rawLabel of labels) {
    const label = rawLabel.trim().toLowerCase();

    if (label.startsWith("2_")) {
      // Service → prefix 2_
      service = label.slice(2).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    } else if (label.startsWith("3_")) {
      company = label.slice(2).replace(/_/g, " ");
    } else if (["urgent","p1", "p2", "p3", "p4"].includes(label)) {
      // Priority → p1-p4
      priority = label.toUpperCase();
    } else if (["l1", "l2"].includes(label)) {
      // Escalate → l1/l2
      escalate = label.toUpperCase();
    } else if (label.startsWith("10_")) {
      // Type → prefix 10_
      const key = label.slice(3);
      type = TYPE_MAPPING[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  return { service, company, priority, escalate, type, rawLabels };
}

// ===========================================================================
// PARSE FRT — Hitung First Response Time dalam detik
// FRT = first_reply_created_at - created_at
// ===========================================================================
export function parseFrt(conv: ChatwootConversation): number | null {
  const createdAt   = conv.created_at;
  const firstReply  = conv.first_reply_created_at;

  if (firstReply && createdAt) {
    return Math.max(0, firstReply - createdAt);
  }

  return null;
}

// ===========================================================================
// PARSE RESOLUTION TIME — Hitung Resolution Time dalam detik
// RT = timestamp last "resolved" activity message - created_at
// ===========================================================================
export function parseResolutionTime(
  messages : ChatwootMessage[],
  createdAt: number
): number | null {
  // Filter activity messages yang mengandung "resolved"
  const resolvedMessages = messages.filter(
    (m) =>
      m.message_type === 2 &&
      (m.content ?? "").toLowerCase().includes("resolved")
  );

  if (!resolvedMessages.length) return null;

  // Ambil resolved message terakhir
  const lastResolved = resolvedMessages[resolvedMessages.length - 1];

  if (lastResolved?.created_at && createdAt) {
    return Math.max(0, lastResolved.created_at - createdAt);
  }

  return null;
}

// ===========================================================================
// PARSE RESOLVE COUNT — Hitung berapa kali conversation di-resolve
// ===========================================================================
export function parseResolveCount(messages: ChatwootMessage[]): number {
  return messages.filter(
    (m) =>
      m.message_type === 2 &&
      (m.content ?? "").toLowerCase().includes("resolved")
  ).length;
}

// ===========================================================================
// PARSE LAST NOTE — Ambil last private note dari agent
// ===========================================================================
export function parseLastNote(messages: ChatwootMessage[]): string | null {
  // Filter hanya private notes
  const privateNotes = messages.filter((m) => m.private === true);

  if (!privateNotes.length) return null;

  // Ambil note terakhir
  const lastNote = privateNotes[privateNotes.length - 1];
  const content  = (lastNote.content ?? "").trim();

  return content || null;
}

// ===========================================================================
// PARSE NOTES — Ambil 3 note berprefix dalam 1x loop messages
// - "Case Subject : ..."  → subject
// - "Root Cause : ..."    → rootCause
// - "Resolution : ..."    → resolution
// Case-insensitive, toleran spasi sekitar ":". Note paling baru yang dipakai.
// ===========================================================================
export function parseNotes(messages: ChatwootMessage[]): {
  subject   : string | null;
  rootCause : string | null;
  resolution: string | null;
} {
  const patterns = [
    { key: "subject"    as const, re: /^case subject\s*:\s*([\s\S]+)/i },
    { key: "rootCause"  as const, re: /^root cause\s*:\s*([\s\S]+)/i   },
    { key: "resolution" as const, re: /^resolution\s*:\s*([\s\S]+)/i   },
  ];

  const result = { subject: null, rootCause: null, resolution: null } as {
    subject: string | null; rootCause: string | null; resolution: string | null;
  };

  for (const m of messages) {
    const text = (m.content ?? "").trim();
    if (!text) continue;
    for (const { key, re } of patterns) {
      const match = text.match(re);
      if (match) result[key] = match[1].trim(); // overwrite → ambil yang terakhir
    }
  }

  return result;
}

// ===========================================================================
// PARSE CUSTOMER INFO — Ambil info customer dari meta.sender
// ===========================================================================
export function parseCustomerInfo(conv: ChatwootConversation): {
  company : string | null;
  customer: string | null;
  phone   : string | null;
} {
  const sender = conv.meta?.sender;
  const attrs  = sender?.additional_attributes;

  return {
    company : attrs?.company_name ?? null,
    customer: sender?.name        ?? null,
    phone   : sender?.phone_number ?? null,
  };
}

// ===========================================================================
// BUILD CONVERSATION — Gabungkan semua parsed data siap simpan ke DB
// ===========================================================================
export function buildConversation(
  conv    : ChatwootConversation,
  messages: ChatwootMessage[]
) {
  const createdAt    = conv.created_at;
  const labels       = conv.labels ?? [];
  const resolveCount = parseResolveCount(messages);

  const { service, company: labelCompany, priority, escalate, type, rawLabels } = parseLabels(labels);
  const customerInfo = parseCustomerInfo(conv);
  const assignee     = conv.meta?.assignee;
  const { csatRating, csatFeedback } = parseCsat(messages);
  const { subject, rootCause, resolution } = parseNotes(messages);

  return {
    ticketId              : conv.id,
    createdAt             : new Date(createdAt * 1000),
    status                : conv._status ?? conv.status ?? "open",
    agent                 : assignee?.name ?? null,
    service,
    priority,
    escalate,
    type,
    rawLabels,
    frtSeconds            : parseFrt(conv),
    resolutionTimeSeconds : parseResolutionTime(messages, createdAt),
    resolveCount,
    isReopened            : resolveCount > 1,
    lastNote              : parseLastNote(messages),
    company               : labelCompany ?? customerInfo.company,
    customer              : customerInfo.customer,
    phone                 : customerInfo.phone,
    csatRating,
    csatFeedback,
    subject,   
    rootCause, 
    resolution,
  };
}

// ===========================================================================
// PARSE CSAT — Ambil rating & feedback dari message bertipe "input_csat"
// Data ada di content_attributes.submitted_values.csat_survey_response
// ===========================================================================
export function parseCsat(messages: ChatwootMessage[]): {
  csatRating  : number | null;
  csatFeedback: string | null;
} {
  // Cari message CSAT yang sudah diisi customer (ada submitted_values-nya)
  const csatMessage = messages.find(
    (m) =>
      m.content_type === "input_csat" &&
      m.content_attributes?.submitted_values?.csat_survey_response != null
  );

  if (!csatMessage) return { csatRating: null, csatFeedback: null };

  const response = csatMessage.content_attributes?.submitted_values?.csat_survey_response;

  return {
    csatRating  : response?.rating           ?? null,
    csatFeedback: response?.feedback_message ?? null,
  };
}
