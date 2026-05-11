const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface ChatResponse {
  response: string;
  agent_type: string;
  confidence: number;
  handoff_from?: string | null;
  handoff_to?: string | null;
}

export interface DocumentItem {
  title: string;
}

export interface AnalyticsOverview {
  total_conversations: number;
  avg_response_time: number;
  resolution_rate: number;
  active_sessions: number;
}

export interface AgentBreakdown {
  agent_type: string;
  count: number;
  avg_confidence: number;
  resolution_rate: number;
}

export interface ConversationSummary {
  id: string;
  message: string;
  agent_type: string;
  confidence: number;
  status: string;
  time: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  business_domain: string;
  created_at: string;
}

export interface DailyStats {
  day: string;
  conversations: number;
}

export interface ConversationDetail {
  id: string;
  project_id: string;
  session_id: string;
  status: string;
  escalated_at: string | null;
  escalation_reason: string | null;
  created_at: string;
  updated_at: string;
  messages: MessageDetail[];
}

export interface MessageDetail {
  id: string;
  role: string;
  content: string;
  agent_type: string | null;
  confidence: number | null;
  created_at: string;
}

export interface EscalatedConversation {
  id: string;
  session_id: string;
  first_message: string;
  agent_type: string;
  escalated_at: string;
  escalation_reason: string | null;
  status: string;
}

export interface StreamEvent {
  agent_type?: string;
  confidence?: number;
  text?: string;
  status?: string;
}

export const api = {
  chat(projectId: string, message: string, sessionId: string) {
    return request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        project_id: projectId,
        message,
        session_id: sessionId,
      }),
    });
  },

  chatStream(
    projectId: string,
    message: string,
    sessionId: string,
    onAgent: (agentType: string, confidence: number) => void,
    onChunk: (text: string) => void,
    onDone: (confidence: number, status: string) => void,
    onError: (error: string) => void,
  ): AbortController {
    const controller = new AbortController();

    fetch(`${BASE_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        message,
        session_id: sessionId,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const block of events) {
            if (!block.trim()) continue;
            const eventMatch = block.match(/^event:\s*(\w+)$/m);
            const dataMatch = block.match(/^data:\s*(.+)$/m);
            if (!eventMatch || !dataMatch) continue;

            try {
              const payload = JSON.parse(dataMatch[1]);
              switch (eventMatch[1]) {
                case "agent":
                  onAgent(payload.agent_type, payload.confidence);
                  break;
                case "chunk":
                  onChunk(payload.text);
                  break;
                case "done":
                  onDone(payload.confidence, payload.status);
                  break;
                case "error":
                  onError(payload.text);
                  break;
              }
            } catch {
              // skip unparseable events
            }
          }
        }

        // Process any remaining complete event in buffer
        if (buffer.trim()) {
          const eventMatch = buffer.match(/^event:\s*(\w+)$/m);
          const dataMatch = buffer.match(/^data:\s*(.+)$/m);
          if (eventMatch && dataMatch) {
            try {
              const payload = JSON.parse(dataMatch[1]);
              if (eventMatch[1] === "done") onDone(payload.confidence, payload.status);
            } catch { /* skip */ }
          }
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          onError(err.message || "Connection failed");
        }
      });

    return controller;
  },

  uploadKnowledge(file: File, projectId: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("project_id", projectId);
    return fetch(`${BASE_URL}/api/knowledge/upload`, { method: "POST", body: form }).then(
      (r) => r.json()
    ) as Promise<{ chunks_stored: number }>;
  },

  listKnowledge(projectId: string) {
    return request<{ documents: DocumentItem[] }>(
      `/api/knowledge/list?project_id=${encodeURIComponent(projectId)}`
    );
  },

  getOverview(projectId: string, period: string) {
    return request<AnalyticsOverview>(
      `/api/analytics/overview?project_id=${encodeURIComponent(projectId)}&period=${period}`
    );
  },

  getDailyStats(projectId: string, period: string) {
    return request<DailyStats[]>(
      `/api/analytics/daily?project_id=${encodeURIComponent(projectId)}&period=${period}`
    );
  },

  getAgentBreakdown(projectId: string, period: string) {
    return request<AgentBreakdown[]>(
      `/api/analytics/agent-breakdown?project_id=${encodeURIComponent(projectId)}&period=${period}`
    );
  },

  getConversations(projectId: string, limit: number = 20) {
    return request<ConversationSummary[]>(
      `/api/analytics/conversations?project_id=${encodeURIComponent(projectId)}&limit=${limit}`
    );
  },

  listProjects() {
    return request<Project[]>("/api/projects");
  },

  createProject(data: { name: string; description?: string; business_domain?: string }) {
    return request<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getProject(projectId: string) {
    return request<Project>(`/api/projects/${encodeURIComponent(projectId)}`);
  },

  updateConversationStatus(conversationId: string, status: string) {
    return request<{ id: string; status: string }>(
      `/api/conversations/${encodeURIComponent(conversationId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );
  },

  getConversation(conversationId: string) {
    return request<ConversationDetail>(
      `/api/conversations/${encodeURIComponent(conversationId)}`
    );
  },

  getEscalated(projectId: string, limit: number = 20) {
    return request<EscalatedConversation[]>(
      `/api/analytics/escalated?project_id=${encodeURIComponent(projectId)}&limit=${limit}`
    );
  },
};
