import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import type { VideoProject } from '@splice/types/generated';
import { toast } from 'sonner';
import { listen } from '@tauri-apps/api/event';
import { getImportErrorMessage, sanitizeErrorForUser } from '../lib/error-messages';

// Interface du store avec state + actions
interface VideoStore {
  // State
  currentProject: VideoProject | null;
  allProjects: VideoProject[];
  isImporting: boolean;
  importProgress: number;
  error: string | null;
  isDragOver: boolean;
  proxyPath: string | null;
  isGeneratingProxy: boolean;

  // Actions
  importVideo: (filePath: string) => Promise<void>;
  loadAllProjects: () => Promise<void>;
  selectProject: (projectId: string) => void;
  clearProject: () => void;
  setError: (error: string | null) => void;
  setDragOver: (isDragOver: boolean) => void;
  setProxyPath: (path: string | null) => void;
  initProxyListener: () => Promise<() => void>;
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
      proxyPath: null,
      isGeneratingProxy: false,

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
            proxyPath: project.proxy_path ?? null,
            isGeneratingProxy: false,
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
          const errorMessage = sanitizeErrorForUser(String(e));

          set({
            error: errorMessage,
            isImporting: false,
            importProgress: 0,
          });

          // Display error toast with French user-friendly message (NFR29)
          toast.error('Erreur d\'importation', {
            description: getImportErrorMessage(String(e)),
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
          set({
            currentProject: project,
            proxyPath: project.proxy_path ?? null,
            isGeneratingProxy: false,
          });
        }
      },

      clearProject: () => {
        set({ currentProject: null, proxyPath: null, isGeneratingProxy: false });
      },

      setError: (error) => {
        set({ error });
      },

      setDragOver: (isDragOver) => {
        set({ isDragOver });
      },

      setProxyPath: (path) => {
        set({ proxyPath: path, isGeneratingProxy: false });
      },

      initProxyListener: async () => {
        const unlisten = await listen<{ project_id: string; proxy_path: string }>(
          'proxy:completed',
          (event) => {
            const { project_id, proxy_path } = event.payload;
            const current = get().currentProject;
            if (current && current.id === project_id) {
              set({ proxyPath: proxy_path, isGeneratingProxy: false });
            }
          }
        );
        return unlisten;
      },
    }),
    { name: 'VideoStore' } // DevTools label
  )
);
