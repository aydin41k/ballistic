import type { UserLookup } from "@/types";

import { apiDataRequest, apiRequest } from "./client";

export async function lookupUsers(query: string): Promise<UserLookup[]> {
  if (!query || query.length < 3) {
    return [];
  }

  const users = await apiDataRequest<UserLookup[]>({
    path: "/api/users/lookup",
    method: "GET",
    params: { q: query },
    errorMessage: "Unable to search users right now.",
  });

  return Array.isArray(users) ? users : [];
}

export async function discoverUser(
  query: string,
): Promise<{ found: boolean; user?: UserLookup }> {
  const body = query.includes("@") ? { email: query } : { phone: query };

  return apiRequest<{ found: boolean; user?: UserLookup }>({
    path: "/api/users/discover",
    method: "POST",
    body,
    errorMessage: "Unable to discover that user right now.",
  });
}

export async function toggleFavourite(
  userId: string,
): Promise<{ is_favourite: boolean; favourites: { data: UserLookup[] } }> {
  return apiRequest<{
    is_favourite: boolean;
    favourites: { data: UserLookup[] };
  }>({
    path: `/api/favourites/${userId}`,
    method: "POST",
    errorMessage: "Unable to update favourites right now.",
  });
}
