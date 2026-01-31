import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import type { VideoProject } from '@splice/types/generated';

// Interface du store avec state + actions
interface VideoStore {
  // State
  currentProject: VideoProject | null;
  allProjects: VideoProject[];
  isImporting: boolean;
  importProgress: number;
  error: string | null;
  isDragOver: boolean;

  // Actions
  importVideo: (filePath: string) => Promise<void>;
  loadAllProjects: () => Promise<void>;
  selectProject: (projectId: string) => void;
  clearProject: () => void;
  setError: (error: string | null) => void;
  setDragOver: (isDragOver: boolean) => void;
}

// Convention: préfixe "use" + nom domaine + "Store"
export const useVideoStore = create<VideoStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentProject: null,
      allProjects: [],
      isImporting: false,
      importProgress: 0,
      error: null,
      isDragOver: false,

      // Actions métier explicites (pas de setters génériques)
      importVideo: async (filePath) => {
        set({ isImporting: true, importProgress: 0, error: null });

        try {
          // import_video use case already saves to SQLite, no need to save again
          const project = await invoke<VideoProject>('import_video', { filePath });

          set({
            currentProject: project,
            isImporting: false,
            importProgress: 100,
            allProjects: [...get().allProjects, project],
          });
        } catch (e) {
          set({
            error: String(e),
            isImporting: false,
            importProgress: 0,
          });
        }
      },

      loadAllProjects: async () => {
        try {
          const projects = await invoke<VideoProject[]>('load_all_projects');
          set({ allProjects: projects, error: null });
        } catch (e) {
          set({ error: String(e) });
        }
      },

      selectProject: (projectId) => {
        const project = get().allProjects.find(p => p.id === projectId);
        if (project) {
          set({ currentProject: project });
        }
      },

      clearProject: () => {
        set({ currentProject: null });
      },

      setError: (error) => {
        set({ error });
      },

      setDragOver: (isDragOver) => {
        set({ isDragOver });
      },
    }),
    { name: 'VideoStore' } // DevTools label
  )
);
