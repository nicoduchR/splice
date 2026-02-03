import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Badge } from '../ui/badge';
import { save } from '@tauri-apps/plugin-dialog';
import { useExportStore, type ExportQuality } from '../../stores/export-store';
import { useVideoStore } from '../../stores/video-store';
import { ExportProgress } from './ExportProgress';
import { ExportComplete } from './ExportComplete';
import { formatFileSize, formatEstimatedDuration } from '../../lib/format-utils';

const QUALITY_OPTIONS: { value: ExportQuality; label: string; description: string }[] = [
  { value: 'preserve', label: 'Préserver l\'original', description: 'Copie directe sans ré-encodage — qualité identique, très rapide' },
  { value: 'high', label: 'Haute', description: 'CRF 18 — ~8 Mbps, excellent compromis' },
  { value: 'medium', label: 'Moyenne', description: 'CRF 23 — ~4 Mbps, bon pour le partage' },
  { value: 'low', label: 'Basse', description: 'CRF 28 — ~2 Mbps, fichier compact' },
];

export function ExportDialog() {
  const isOpen = useExportStore(s => s.isExportDialogOpen);
  const closeDialog = useExportStore(s => s.closeExportDialog);
  const settings = useExportStore(s => s.exportSettings);
  const updateSettings = useExportStore(s => s.updateSettings);
  const estimatedFileSize = useExportStore(s => s.estimatedFileSize);
  const estimatedDuration = useExportStore(s => s.estimatedDuration);
  const isEstimating = useExportStore(s => s.isEstimating);
  const estimateExportSize = useExportStore(s => s.estimateExportSize);
  const startExport = useExportStore(s => s.startExport);
  const isExporting = useExportStore(s => s.isExporting);
  const exportResult = useExportStore(s => s.exportResult);
  const resetExport = useExportStore(s => s.resetExport);
  const currentProject = useVideoStore(s => s.currentProject);

  // Auto-suggest filename when dialog opens
  useEffect(() => {
    if (isOpen && currentProject && !settings.fileName) {
      const baseName = currentProject.file_name.replace(/\.[^.]+$/, '');
      updateSettings({ fileName: `${baseName}_edited.mp4` });
    }
  }, [isOpen, currentProject, settings.fileName, updateSettings]);

  // Estimate when dialog opens or quality changes
  useEffect(() => {
    if (isOpen && currentProject) {
      estimateExportSize(currentProject.id, settings.quality);
    }
  }, [isOpen, currentProject, settings.quality, estimateExportSize]);

  const handleBrowse = async () => {
    const filePath = await save({
      filters: [{ name: 'MP4', extensions: ['mp4'] }],
      defaultPath: settings.fileName || 'video_edited.mp4',
    });
    if (filePath) {
      // Extract directory and filename from the full path
      const lastSep = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
      if (lastSep >= 0) {
        updateSettings({
          outputPath: filePath.substring(0, lastSep),
          fileName: filePath.substring(lastSep + 1),
        });
      } else {
        updateSettings({ fileName: filePath });
      }
    }
  };

  const handleExport = () => {
    if (currentProject) {
      startExport(currentProject.id);
    }
  };

  const handleExportAnother = () => {
    resetExport();
    // Settings are preserved, dialog stays open for new export
  };

  const handleCloseComplete = () => {
    resetExport();
    closeDialog();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isExporting && !exportResult) closeDialog(); }}>
      <DialogContent className="bg-gray-950 border border-gray-800 sm:max-w-[500px]">
        {exportResult ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">Export terminé</DialogTitle>
              <DialogDescription className="text-gray-500">
                Votre vidéo a été exportée avec succès.
              </DialogDescription>
            </DialogHeader>
            <ExportComplete
              result={exportResult}
              onExportAnother={handleExportAnother}
              onClose={handleCloseComplete}
            />
          </>
        ) : isExporting ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">Export de la vidéo</DialogTitle>
              <DialogDescription className="text-gray-500">
                Veuillez patienter pendant que votre vidéo est exportée.
              </DialogDescription>
            </DialogHeader>
            <ExportProgress />
          </>
        ) : (
        <>
        <DialogHeader>
          <DialogTitle className="text-white">Exporter la vidéo</DialogTitle>
          <DialogDescription className="text-gray-500">
            Configurez les paramètres d'export avant de finaliser votre vidéo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format (fixed) */}
          <div>
            <Label className="text-gray-300 text-sm">Format</Label>
            <div className="mt-1.5">
              <Badge variant="secondary" className="bg-gray-800 text-gray-300 border-gray-700">
                MP4 • H.264 High
              </Badge>
            </div>
          </div>

          {/* Quality selection */}
          <div>
            <Label className="text-gray-300 text-sm">Qualité</Label>
            <RadioGroup
              value={settings.quality}
              onValueChange={(v) => updateSettings({ quality: v as ExportQuality })}
              className="mt-2 space-y-2"
            >
              {QUALITY_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={opt.value} id={`quality-${opt.value}`} className="mt-0.5" />
                  <div>
                    <Label htmlFor={`quality-${opt.value}`} className="text-gray-200 font-medium cursor-pointer">
                      {opt.label}
                    </Label>
                    <p className="text-gray-500 text-xs">{opt.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Output destination */}
          <div>
            <Label className="text-gray-300 text-sm">Destination</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                value={settings.outputPath ? `${settings.outputPath}/${settings.fileName}` : ''}
                readOnly
                className="bg-gray-900 border-gray-700 text-gray-300 text-sm flex-1"
                placeholder="Choisissez un emplacement..."
              />
              <Button variant="outline" size="sm" onClick={handleBrowse} className="border-gray-700 shrink-0">
                Parcourir
              </Button>
            </div>
          </div>

          {/* Filename */}
          <div>
            <Label className="text-gray-300 text-sm">Nom du fichier</Label>
            <Input
              value={settings.fileName}
              onChange={(e) => updateSettings({ fileName: e.target.value })}
              className="bg-gray-900 border-gray-700 text-gray-300 text-sm mt-1.5"
              placeholder="video_edited.mp4"
            />
          </div>

          {/* Estimates */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-500">Taille estimée : </span>
              <span className="text-gray-300">
                {isEstimating ? '...' : estimatedFileSize != null ? formatFileSize(estimatedFileSize) : '—'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Temps estimé : </span>
              <span className="text-gray-300">
                {isEstimating ? '...' : estimatedDuration != null ? formatEstimatedDuration(estimatedDuration) : '—'}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col items-end gap-2 sm:flex-col">
          {!settings.outputPath && (
            <p className="text-amber-500 text-xs w-full text-right">
              Sélectionnez une destination avec « Parcourir » avant d'exporter
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={closeDialog} className="border-gray-700">
              Annuler
            </Button>
            <Button
              onClick={handleExport}
              disabled={!settings.outputPath || !settings.fileName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Exporter
            </Button>
          </div>
        </DialogFooter>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
