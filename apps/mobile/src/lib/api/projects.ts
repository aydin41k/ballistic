import type { Project } from "@/types";

import { apiDataRequest } from "./client";

export async function fetchProjects(): Promise<Project[]> {
  const projects = await apiDataRequest<Project[]>({
    path: "/api/projects",
    method: "GET",
    errorMessage: "Unable to load projects right now.",
  });

  return Array.isArray(projects) ? projects : [];
}

export async function createProject(payload: {
  name: string;
  color?: string | null;
}): Promise<Project> {
  return apiDataRequest<Project>({
    path: "/api/projects",
    method: "POST",
    body: {
      name: payload.name,
      color: payload.color || null,
    },
    errorMessage: "Unable to create the project right now.",
  });
}
