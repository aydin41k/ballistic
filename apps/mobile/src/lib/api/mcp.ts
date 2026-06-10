import type { McpToken } from "@/types";

import { apiDataRequest, apiRequest } from "./client";

export async function fetchMcpTokens(): Promise<McpToken[]> {
  const tokens = await apiDataRequest<McpToken[]>({
    path: "/api/mcp/tokens",
    method: "GET",
    errorMessage: "Unable to load AI assistant tokens right now.",
  });

  return Array.isArray(tokens) ? tokens : [];
}

export async function createMcpToken(
  name: string,
): Promise<{ token: string; token_record: McpToken }> {
  const data = await apiDataRequest<{ token: string; token_record: McpToken }>({
    path: "/api/mcp/tokens",
    method: "POST",
    body: { name },
    errorMessage: "Unable to create the AI assistant token right now.",
  });

  if (!data || !data.token || !data.token_record) {
    throw new Error("Invalid MCP token response");
  }

  return data;
}

export async function revokeMcpToken(tokenId: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/mcp/tokens/${tokenId}`,
    method: "DELETE",
    errorMessage: "Unable to revoke the AI assistant token right now.",
  });
}
