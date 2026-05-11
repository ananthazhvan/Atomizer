"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, Project } from "@/lib/api";

interface ProjectContextValue {
  projectId: string;
  setProjectId: (id: string) => void;
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  refreshProjects: () => Promise<Project[]>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

const STORAGE_KEY = "atomizer_project_id";

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectIdState] = useState("demo");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProjects = useCallback(async () => {
    try {
      const list = await api.listProjects();
      setProjects(list);
      return list;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setProjectIdState(stored);
    refreshProjects().then((list) => {
      if (stored && !list.find((p) => p.id === stored)) {
        localStorage.removeItem(STORAGE_KEY);
        setProjectIdState("demo");
      }
    });
  }, [refreshProjects]);

  const setProjectId = useCallback((id: string) => {
    setProjectIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const currentProject = projects.find((p) => p.id === projectId) || null;

  return (
    <ProjectContext.Provider
      value={{ projectId, setProjectId, projects, currentProject, loading, refreshProjects }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
