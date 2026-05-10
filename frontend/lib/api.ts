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

  getAgentBreakdown(projectId: string, period: string) {
    return request<AgentBreakdown[]>(
      `/api/analytics/agent-breakdown?project_id=${encodeURIComponent(projectId)}&period=${period}`
    );
  },
};
