"use client";

import Image from "next/image";
import type { ItemScope, Project, User } from "@/types";
import { NO_PROJECT_FILTER_ID } from "@/lib/projectFilters";
import { NotificationCentre } from "./NotificationCentre";

type SidebarIconName =
  | "journal"
  | "notes"
  | "activity"
  | "settings"
  | "profile"
  | "logout"
  | "plus";

interface DesktopSidebarProps {
  user: User | null;
  projects: Project[];
  excludedProjectIds: Set<string>;
  dates: boolean;
  delegation: boolean;
  viewScope: ItemScope;
  onSetViewScope: (scope: ItemScope) => void;
  onToggleProject: (projectId: string) => void;
  onClearProjects: () => void;
  onNewTask: () => void;
  onOpenNotes: () => void;
  onOpenActivity: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export function DesktopSidebar({
  user,
  projects,
  excludedProjectIds,
  dates,
  delegation,
  viewScope,
  onSetViewScope,
  onToggleProject,
  onClearProjects,
  onNewTask,
  onOpenNotes,
  onOpenActivity,
  onOpenSettings,
  onOpenProfile,
  onLogout,
}: DesktopSidebarProps) {
  const activeFilterCount =
    excludedProjectIds.size + (dates && viewScope === "planned" ? 1 : 0);
  const initials = (user?.name || "B")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[17.5rem] shrink-0 flex-col border-r border-slate-200/80 bg-white lg:flex">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6">
        <div className="flex items-center gap-3 px-1">
          <Image
            src="/logo.png"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 rounded-xl shadow-sm"
            priority
          />
          <div>
            <p className="text-xl font-bold tracking-tight text-[var(--navy)]">
              Ballistic
            </p>
            <p className="text-[11px] font-medium text-slate-400">
              The Simplest Bullet List
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNewTask}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--blue)] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[var(--blue-600)] hover:shadow-xl active:scale-[0.98]"
        >
          <SidebarIcon name="plus" />
          Add task
        </button>

        <nav className="mt-7 space-y-1" aria-label="Workspace">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>
          <SidebarButton icon="journal" label="Journal" active />
          <SidebarButton icon="notes" label="Notes" onClick={onOpenNotes} />
          <SidebarButton
            icon="activity"
            label="Activity"
            onClick={onOpenActivity}
          />
          <NotificationCentre delegation={delegation} variant="sidebar" />
          <SidebarButton
            icon="settings"
            label="Settings"
            onClick={onOpenSettings}
          />
        </nav>

        <section className="mt-7 border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Filters
              </p>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-[10px] font-bold text-blue-700">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClearProjects();
                  onSetViewScope("active");
                }}
                className="text-xs font-semibold text-[var(--blue-600)] hover:text-[var(--blue)]"
              >
                Reset
              </button>
            )}
          </div>

          {dates && (
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {(["active", "planned"] as const).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => onSetViewScope(scope)}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold capitalize transition ${viewScope === scope ? "bg-white text-[var(--navy)] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {scope}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
            <ProjectFilterButton
              label="No project"
              included={!excludedProjectIds.has(NO_PROJECT_FILTER_ID)}
              onClick={() => onToggleProject(NO_PROJECT_FILTER_ID)}
            />
            {projects.map((project) => (
              <ProjectFilterButton
                key={project.id}
                label={project.name}
                colour={project.color}
                included={!excludedProjectIds.has(project.id)}
                onClick={() => onToggleProject(project.id)}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="border-t border-slate-200/80 p-4">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--navy)] text-xs font-bold text-white">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-[var(--navy)]">
              {user?.name || "Profile"}
            </span>
            <span className="block truncate text-xs text-slate-400">
              {user?.email || "View your profile"}
            </span>
          </span>
          <SidebarIcon name="profile" className="text-slate-400" />
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <SidebarIcon name="logout" />
          Log out
        </button>
      </div>
    </aside>
  );
}

function SidebarButton({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: SidebarIconName;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active ? "bg-blue-50 text-[var(--navy)]" : "text-slate-600 hover:bg-slate-50 hover:text-[var(--navy)]"}`}
    >
      <SidebarIcon
        name={icon}
        className={active ? "text-[var(--blue-600)]" : "text-slate-500"}
      />
      <span>{label}</span>
    </button>
  );
}

function ProjectFilterButton({
  label,
  colour,
  included,
  onClick,
}: {
  label: string;
  colour?: string | null;
  included: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={included}
      className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition ${included ? "text-slate-700 hover:bg-slate-50" : "bg-slate-50 text-slate-400 line-through"}`}
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${colour ? "" : "bg-slate-300"}`}
        style={colour ? { backgroundColor: colour } : undefined}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span
        className={`grid h-4 w-4 place-items-center rounded border text-[10px] ${included ? "border-[var(--blue-600)] bg-[var(--blue-600)] text-white" : "border-slate-300 bg-white text-transparent"}`}
        aria-hidden="true"
      >
        ✓
      </span>
    </button>
  );
}

function SidebarIcon({
  name,
  className = "",
}: {
  name: SidebarIconName;
  className?: string;
}) {
  const paths: Record<SidebarIconName, React.ReactNode> = {
    journal: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2" />
      </>
    ),
    notes: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
    activity: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5M21 12H9" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
