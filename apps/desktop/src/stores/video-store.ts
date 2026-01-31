import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import type { VideoProject } from '@splice/types/generated';
import { toast } from 'sonner';
import { getImportErrorMessage } from '../lib/error-messages';

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

          // Display success toast with video metadata
          const formatDuration = (seconds: number): string => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);

            if (hours > 0) {
              return `${hours}h ${minutes}m ${secs}s`;
            } else if (minutes > 0) {
              return `${minutes}m ${secs}s`;
            } else {
              return `${secs}s`;
            }
          };

          let description = `${project.file_name} - ${formatDuration(project.duration_seconds)}`;

          // Add resolution if available
          if (project.width && project.height) {
            description += ` • ${project.width}x${project.height}`;
          }

          toast.success('Vidéo importée avec succès', {
            description,
          });
        } catch (e) {
          const errorMessage = String(e);

          set({
            error: errorMessage,
            isImporting: false,
            importProgress: 0,
          });

          // Display error toast with French user-friendly message (NFR29)
          toast.error('Erreur d\'importation', {
            description: getImportErrorMessage(errorMessage),
          });
        }
      },

      loadAllProjects: async () => {
        try {
          const projects = await invoke<VideoProject[]>('load_all_projects');
          set({ allProjects: projects, error: null });
        } catch (e) {
          set({ error: String(e) });
          toast.error('Impossible de charger les projets');
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
