import { useEffect } from 'react';
import { useVideoStore } from './stores/video-store';
import { VideoImport } from './components/video-import';
import { TopBar } from './components/layout';
import { Toaster } from './components/ui/sonner';

function App() {
  const currentProject = useVideoStore(s => s.currentProject);
  const loadAllProjects = useVideoStore(s => s.loadAllProjects);

  // Load all projects on mount
  useEffect(() => {
    // Only load if running in Tauri (not in browser dev mode)
    if (window.__TAURI__) {
      loadAllProjects();
    }
  }, [loadAllProjects]);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <TopBar />
      <Toaster />

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">
        {/* Abstract Background Gradient for depth */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]"></div>
          <div className="absolute top-[40%] right-[5%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]"></div>
        </div>

        {!currentProject ? (
          <div className="relative w-full max-w-[800px] flex flex-col items-center justify-center">
            <VideoImport />
          </div>
        ) : (
          <div className="text-white relative z-10">
            <h1 className="text-2xl font-bold mb-4">Projet chargé</h1>
            <div className="bg-card p-6 rounded-lg border border-border">
              <p className="mb-2"><strong>Fichier:</strong> {currentProject.file_name}</p>
              <p><strong>Chemin:</strong> {currentProject.file_path}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
