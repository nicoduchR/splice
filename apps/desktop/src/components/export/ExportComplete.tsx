import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { useExportStore, type ExportResult } from '../../stores/export-store';
import { formatFileSize, formatDuration, getFileBrowserName } from '../../lib/format-utils';

interface ExportCompleteProps {
  result: ExportResult;
  onExportAnother: () => void;
  onClose: () => void;
}

export function ExportComplete({ result, onExportAnother, onClose }: ExportCompleteProps) {
  const closeExportResult = useExportStore(s => s.closeExportResult);

  const handleOpenFile = async () => {
    try {
      await invoke('open_file', { path: result.outputPath });
    } catch (e) {
      console.error('Failed to open file:', e);
      toast.error("Impossible d'ouvrir le fichier");
    }
  };

  const handleShowInFolder = async () => {
    try {
      await invoke('show_in_folder', { path: result.outputPath });
    } catch (e) {
      console.error('Failed to show in folder:', e);
      toast.error(`Impossible d'afficher dans ${getFileBrowserName()}`);
    }
  };

  const fileBrowserName = getFileBrowserName();

  const handleExportAnother = () => {
    closeExportResult();
    onExportAnother();
  };

  const handleClose = () => {
    closeExportResult();
    onClose();
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg border border-emerald-600/50">
      {/* Success header */}
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle className="h-8 w-8 text-emerald-500" />
        <h3 className="text-xl font-bold text-white">Export terminé avec succès!</h3>
      </div>

      {/* File metadata */}
      <div className="space-y-2 mb-6 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Taille du fichier:</span>
          <span className="text-gray-200">{formatFileSize(result.fileSizeBytes)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Durée:</span>
          <span className="text-gray-200">{formatDuration(result.durationSeconds)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-gray-400">Emplacement:</span>
          <span className="text-gray-300 text-xs break-all">{result.outputPath}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleOpenFile}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Ouvrir le fichier
        </Button>
        <Button
          variant="outline"
          onClick={handleShowInFolder}
          className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          Afficher dans {fileBrowserName}
        </Button>
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            onClick={handleExportAnother}
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Exporter un autre
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            className="flex-1 text-gray-400 hover:text-gray-200"
          >
            Terminé
          </Button>
        </div>
      </div>
    </div>
  );
}
