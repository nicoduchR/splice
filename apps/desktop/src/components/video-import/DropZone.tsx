import React, { useState, useEffect, useCallback } from 'react';
import { FileVideo, FolderOpen } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import { toast } from 'sonner';

interface DropZoneProps {
  onFileSelected: (filePath: string) => void;
  onBrowseFiles: () => void;
  isValidating: boolean;
  error: string | null;
}

export const DropZone = React.memo(({
  onFileSelected,
  onBrowseFiles,
  isValidating,
  error,
}: DropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Listen to Tauri file drop events
  useEffect(() => {
    console.log('Setting up Tauri file drop listeners...');

    const setupListeners = async () => {
      try {
        // Listen for file drop hover
        const unlistenHover = await listen('tauri://file-drop-hover', (event) => {
          console.log('🟡 File drag hover detected', event);
          setIsDragOver(true);
        });

        // Listen for file drop
        const unlistenDrop = await listen<string[]>('tauri://file-drop', (event) => {
          console.log('🟢 File dropped!', event.payload);
          console.time('drop-response');
          setIsDragOver(false);

          if (event.payload && event.payload.length > 0) {
            const filePath = event.payload[0];
            console.log('📁 File path:', filePath);
            onFileSelected(filePath);
          }

          console.timeEnd('drop-response');
        });

        // Listen for file drop cancelled
        const unlistenCancelled = await listen('tauri://file-drop-cancelled', (event) => {
          console.log('🔴 File drop cancelled', event);
          setIsDragOver(false);
        });

        console.log('✅ Tauri file drop listeners setup complete');

        return () => {
          unlistenHover();
          unlistenDrop();
          unlistenCancelled();
          console.log('🧹 Tauri file drop listeners cleaned up');
        };
      } catch (error) {
        console.error('❌ Error setting up Tauri listeners:', error);
        toast.error('Impossible d\'initialiser le drag & drop. Utilisez le bouton "Parcourir les fichiers".');
      }
    };

    let cleanup: (() => void) | undefined;
    setupListeners().then((fn) => {
      cleanup = fn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [onFileSelected]);

  // Validating state
  if (isValidating) {
    return (
      <div className="w-full rounded-2xl border-2 border-dashed border-[#35353F] bg-[#161f2b] p-12 sm:p-20 flex flex-col items-center gap-8">
        <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-white font-semibold text-lg">Vérification du format...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full rounded-2xl border-2 border-destructive bg-destructive/10 p-12 sm:p-20 flex flex-col items-center gap-8">
        <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
          <span className="text-white text-3xl font-bold">!</span>
        </div>
        <p className="text-destructive font-medium text-center max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
        >
          Choisir un autre fichier
        </button>
      </div>
    );
  }

  // Empty / Drag over state
  return (
    <div
      onClick={!isValidating ? onBrowseFiles : undefined}
      className={`
        w-full rounded-2xl border-2 bg-[#161f2b] p-12 sm:p-20
        flex flex-col items-center gap-8 transition-all duration-300
        group
        ${!isValidating ? 'cursor-pointer' : 'cursor-default'}
        ${isDragOver
          ? 'border-solid border-primary bg-[#1c2633] shadow-[0_0_40px_-10px_rgba(21,128,249,0.15)]'
          : 'border-dashed border-[#35353F] hover:border-primary/50 hover:bg-[#1c2633] hover:shadow-[0_0_40px_-10px_rgba(21,128,249,0.15)]'
        }
      `}
    >
      {/* Icon with glow effect */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
        <FileVideo
          className={`
            relative z-10 text-primary drop-shadow-sm transition-transform duration-300 ease-out
            ${isDragOver ? 'w-20 h-20 scale-110' : 'w-16 h-16 group-hover:scale-110'}
          `}
        />
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-center gap-3 text-center max-w-lg">
        <h1 className={`text-2xl sm:text-3xl font-bold text-white tracking-tight transition-all duration-300 ${
          isDragOver ? 'scale-105' : ''
        }`}>
          Importez votre première vidéo
        </h1>
        <p className={`text-slate-400 text-base sm:text-lg font-normal leading-relaxed transition-all duration-300 ${
          isDragOver ? 'text-primary/80 scale-105' : ''
        }`}>
          Glissez-déposez un fichier vidéo ici ou cliquez pour sélectionner
        </p>
      </div>

      {/* Actions & Meta */}
      <div className="flex flex-col items-center gap-6 mt-2 w-full">
        {/* Ghost Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBrowseFiles();
          }}
          disabled={isValidating}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-primary font-bold text-sm sm:text-base hover:bg-primary/10 transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FolderOpen className="w-5 h-5" />
          <span>Parcourir les fichiers</span>
        </button>

        {/* Format Badge */}
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#21344a] border border-[#2f4b6a]">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            MP4 • MOV • AVI • Jusqu'à 50GB
          </span>
        </div>
      </div>
    </div>
  );
});

DropZone.displayName = 'DropZone';
