"use client";

import type { Project } from "@/types";
import { useState, useRef, useEffect, useCallback } from "react";

type Props = {
  projects: Project[];
  value: string | null;
  onChange: (projectId: string | null) => void;
  onCreateProject: (name: string) => Promise<Project>;
};

export function ProjectCombobox({
  projects,
  value,
  onChange,
  onCreateProject,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find selected project
  const selectedProject = projects.find((p) => p.id === value) ?? null;

  // Filter projects by search
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Check if search matches an existing project exactly
  const exactMatch = projects.some(
    (p) => p.name.toLowerCase() === search.toLowerCase(),
  );

  // Show "Create" option if search has text and no exact match
  const showCreateOption = search.trim().length > 0 && !exactMatch;

  // Total options count (for keyboard navigation)
  const totalOptions = filteredProjects.length + (showCreateOption ? 1 : 0) + 1; // +1 for "No project"

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [search, filteredProjects.length]);

  const handleSelect = useCallback(
    (projectId: string | null) => {
      onChange(projectId);
      setIsOpen(false);
      setSearch("");
    },
    [onChange],
  );

  const handleCreate = useCallback(async () => {
    if (!search.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const newProject = await onCreateProject(search.trim());
      onChange(newProject.id);
      setIsOpen(false);
      setSearch("");
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreating(false);
    }
  }, [search, isCreating, onCreateProject, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) => Math.min(prev + 1, totalOptions - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          // Index 0 = "No project"
          // Index 1 to filteredProjects.length = projects
          // Last index (if showCreateOption) = "Create" option
          if (highlightedIndex === 0) {
            handleSelect(null);
          } else if (highlightedIndex <= filteredProjects.length) {
            handleSelect(filteredProjects[highlightedIndex - 1].id);
          } else if (showCreateOption) {
            handleCreate();
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSearch("");
          break;
      }
    },
    [
      isOpen,
      highlightedIndex,
      totalOptions,
      filteredProjects,
      showCreateOption,
      handleSelect,
      handleCreate,
    ],
  );

  // Get project colour dot
  const getColourDot = (color: string | null) => {
    const bgColor = color || "#94a3b8"; // Default slate colour
    return (
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: bgColor }}
      />
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-left transition-all duration-200 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 focus:outline-none hover:border-slate-400"
      >
        {selectedProject ? (
          <>
            {getColourDot(selectedProject.color)}
            <span className="flex-1 truncate">{selectedProject.name}</span>
          </>
        ) : (
          <span className="flex-1 text-slate-500">No project</span>
        )}
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            d="m6 9 6 6 6-6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg animate-fade-in">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or create..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)]/20 focus:outline-none"
            />
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {/* "No project" option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                highlightedIndex === 0 ? "bg-slate-100" : "hover:bg-slate-50"
              } ${value === null ? "text-[var(--blue)] font-medium" : "text-slate-600"}`}
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0" />
              <span>No project</span>
            </button>

            {/* Existing projects */}
            {filteredProjects.map((project, index) => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleSelect(project.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  highlightedIndex === index + 1
                    ? "bg-slate-100"
                    : "hover:bg-slate-50"
                } ${value === project.id ? "text-[var(--blue)] font-medium" : "text-slate-700"}`}
              >
                {getColourDot(project.color)}
                <span className="truncate">{project.name}</span>
              </button>
            ))}

            {/* "Create" option */}
            {showCreateOption && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  highlightedIndex === filteredProjects.length + 1
                    ? "bg-slate-100"
                    : "hover:bg-slate-50"
                } text-[var(--blue)] ${isCreating ? "opacity-50" : ""}`}
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--blue)] shrink-0 flex items-center justify-center text-white text-xs leading-none">
                  +
                </span>
                <span>
                  {isCreating ? "Creating..." : `Create "${search.trim()}"`}
                </span>
              </button>
            )}

            {/* Empty state */}
            {filteredProjects.length === 0 && !showCreateOption && (
              <div className="px-3 py-2 text-sm text-slate-500">
                No projects found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
