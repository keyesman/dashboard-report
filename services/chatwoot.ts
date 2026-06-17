// =============================================================================
// services/chatwoot.ts
// Chatwoot API client — fetch conversations & messages dari Chatwoot
//
// Functions:
// - getConversationsByStatus : Fetch conversations by status dengan pagination
// - getAllConversations       : Fetch semua conversations dari semua status
// - getMessages              : Fetch messages dari 1 conversation
// =============================================================================

// ===========================================================================
// TYPES
// ===========================================================================
export interface ChatwootConversation {
    id                  : number;
    created_at          : number; // Unix timestamp
    status              : string;
    labels              : string[];
    first_reply_created_at?: number;
    csat_rating         ?: number;
    csat_feedback       ?: string;
    meta: {
      sender  ?: {
        name                 ?: string;
        phone_number         ?: string;
        additional_attributes?: {
          company_name?: string;
        };
      };
      assignee?: {
        name?: string;
      };
    };
    _status?: string; // Internal — status dari loop fetch
  }
  
  export interface ChatwootMessage {
    id           : number;
    content      : string | null;
    message_type : number; // 2 = activity message
    private      : boolean;
    created_at   : number;
  }
  
  // ===========================================================================
  // API CONFIG — Ambil dari environment variables
  // ===========================================================================
  function getApiConfig() {
    const baseUrl   = process.env.CHATWOOT_BASE_URL;
    const token     = process.env.CHATWOOT_API_TOKEN;
    const accountId = process.env.CHATWOOT_ACCOUNT_ID;
  
    if (!baseUrl || !token || !accountId) {
      throw new Error(
        "Missing Chatwoot config. Pastikan CHATWOOT_BASE_URL, CHATWOOT_API_TOKEN, CHATWOOT_ACCOUNT_ID ada di .env"
      );
    }
  
    return { baseUrl, token, accountId };
  }
  
  // ===========================================================================
  // GET CONVERSATIONS BY STATUS
  // Fetch semua conversations by status dengan pagination
  // Stop kalau semua data di 1 page udah lebih tua dari dateFrom
  // ===========================================================================
  export async function getConversationsByStatus(
    status  : string,
    dateFrom: string,
    dateTo  : string
  ): Promise<ChatwootConversation[]> {
    const { baseUrl, token, accountId } = getApiConfig();
  
    const allConversations: ChatwootConversation[] = [];
    let page = 1;
  
    while (true) {
      // Fetch 1 page dari Chatwoot API
      const response = await fetch(
        `${baseUrl}/api/v1/accounts/${accountId}/conversations?page=${page}&status=${status}`,
        {
          headers: {
            "api_access_token": token,
            "Content-Type"    : "application/json",
          },
        }
      );
  
      if (!response.ok) {
        console.error(`[Chatwoot] Gagal fetch status=${status} page=${page}: HTTP ${response.status}`);
        break;
      }
  
      const data          = await response.json();
      const conversations = data?.data?.payload ?? [];
  
      // Stop kalau tidak ada data lagi
      if (!conversations.length) break;
  
      let allOlder = true; // Flag: semua data di page ini lebih tua dari dateFrom
  
      for (const conv of conversations) {
        const createdAt = conv.created_at;
  
        if (createdAt) {
          // Convert unix timestamp ke YYYY-MM-DD
          const convDate = new Date(createdAt * 1000).toISOString().split("T")[0];
  
          // Skip kalau lebih baru dari dateTo
          if (convDate > dateTo) {
            allOlder = false;
            continue;
          }
  
          // Dalam range → ambil
          if (convDate >= dateFrom) {
            allOlder = false;
            allConversations.push({ ...conv, _status: status });
          }
  
          // Lebih tua dari dateFrom → allOlder tetap true
        } else {
          allConversations.push({ ...conv, _status: status });
        }
      }
  
      console.log(
        `[Chatwoot] Page ${page} status=${status} | terkumpul: ${allConversations.length}`
      );
  
      // Stop kalau semua data di page ini lebih tua dari dateFrom
      if (allOlder) {
        console.log(`[Chatwoot] Page ${page} semua data lebih tua dari ${dateFrom} → stop`);
        break;
      }
  
      page++;
    }
  
    return allConversations;
  }
  
  // ===========================================================================
  // GET ALL CONVERSATIONS — Fetch dari semua status dalam date range
  // ===========================================================================
  const CONVERSATION_STATUSES = ["open", "resolved", "pending", "snoozed"];
  
  export async function getAllConversations(
    dateFrom: string,
    dateTo  : string
  ): Promise<ChatwootConversation[]> {
    const allConversations: ChatwootConversation[] = [];
  
    for (const status of CONVERSATION_STATUSES) {
      console.log(`[Chatwoot] Fetching status: ${status}...`);
      const convs = await getConversationsByStatus(status, dateFrom, dateTo);
      console.log(`[Chatwoot] → ${convs.length} conversations`);
      allConversations.push(...convs);
    }
  
    // Sort dari terbaru ke terlama
    return allConversations.sort((a, b) => b.created_at - a.created_at);
  }
  
  // ===========================================================================
  // GET MESSAGES — Fetch semua messages dari 1 conversation
  // ===========================================================================
  export async function getMessages(
    conversationId: number
  ): Promise<ChatwootMessage[]> {
    const { baseUrl, token, accountId } = getApiConfig();
  
    const response = await fetch(
      `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
      {
        headers: {
          "api_access_token": token,
          "Content-Type"    : "application/json",
        },
      }
    );
  
    if (!response.ok) return [];
  
    const data = await response.json();
    return data?.payload ?? [];
  }
  