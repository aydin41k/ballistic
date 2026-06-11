import type { User } from "@/types";

import { apiDataRequest } from "./client";

export type UserUpdatePayload = Partial<
  Pick<User, "name" | "email" | "phone" | "notes" | "bio" | "avatar_url"> & {
    feature_flags: Partial<NonNullable<User["feature_flags"]>> | null;
  }
>;

export async function fetchUser(): Promise<User> {
  return apiDataRequest<User>({
    path: "/api/user",
    method: "GET",
    errorMessage:
      "Unable to load your account. Check that the backend is running and reachable from the mobile app.",
  });
}

export async function updateUser(data: UserUpdatePayload): Promise<User> {
  return apiDataRequest<User>({
    path: "/api/user",
    method: "PATCH",
    body: data,
    errorMessage: "Unable to save your profile changes right now.",
  });
}
