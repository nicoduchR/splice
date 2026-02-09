import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useUpdateStore } from '@/stores/update-store';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import { Loader2, Trash2, FolderOpen } from 'lucide-react';
import type { CacheSizeInfo, CacheClearedInfo } from '@splice/types/generated';
import {
  getPreference,
  setPreference,
  PREF_TEMP_DIRECTORY,
} from '@/services/preferences-service';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  // Rollback state
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const backupInfo = useUpdateStore((s) => s.backupInfo);
  const fetchBackupInfo = useUpdateStore((s) => s.fetchBackupInfo);
  const performManualRollback = useUpdateStore((s) => s.performManualRollback);

  // Cache state
  const [cacheSize, setCacheSize] = useState<CacheSizeInfo | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Temp directory state
  const [tempDirectory, setTempDirectory] = useState<string | null>(null);

  const fetchCacheSize = useCallback(async () => {
    setIsLoadingCache(true);
    try {
      const size = await invoke<CacheSizeInfo>('get_cache_size');
      setCacheSize(size);
    } catch {
      setCacheSize(null);
    } finally {
      setIsLoadingCache(false);
    }
  }, []);

  const fetchTempDirectory = useCallback(async () => {
    try {
      const dir = await getPreference(PREF_TEMP_DIRECTORY);
      setTempDirectory(dir);
    } catch {
      setTempDirectory(null);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchBackupInfo();
      fetchCacheSize();
      fetchTempDirectory();
    }
  }, [isOpen, fetchBackupInfo, fetchCacheSize, fetchTempDirectory]);

  const handleRollback = async () => {
    setShowRollbackConfirm(false);
    await performManualRollback();
  };

  const handleClearCache = async () => {
    setShowClearConfirm(false);
    setIsClearingCache(true);
    try {
      const result = await invoke<CacheClearedInfo>('clear_cache');
      toast.success('Cache vidé', {
        description: `${result.freed_gb.toFixed(2)} Go libérés`,
      });
      await fetchCacheSize();
    } catch (e) {
      toast.error('Erreur lors du vidage du cache', {
        description: String(e),
      });
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleChangeTempDir = async () => {
    try {
      const selected = await open({ directory: true, title: 'Choisir le répertoire temporaire' });
      if (selected) {
        await setPreference(PREF_TEMP_DIRECTORY, selected as string);
        setTempDirectory(selected as string);
        toast.success('Répertoire temporaire mis à jour');
      }
    } catch (e) {
      toast.error('Erreur', { description: String(e) });
    }
  };

  const handleResetTempDir = async () => {
    try {
      await setPreference(PREF_TEMP_DIRECTORY, '');
      setTempDirectory(null);
      toast.success('Répertoire temporaire réinitialisé (par défaut)');
    } catch (e) {
      toast.error('Erreur', { description: String(e) });
    }
  };

  const formatGb = (gb: number) => {
    if (gb < 0.01) return '< 0.01 Go';
    return `${gb.toFixed(2)} Go`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="bg-card-dark border-white/5 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Paramètres</DialogTitle>
            <DialogDescription className="text-gray-500">
              Gérer le stockage, les fichiers temporaires et les mises à jour.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Section: Stockage */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Stockage</h3>
              <div className="rounded-md bg-gray-900 p-3 border border-gray-800 space-y-2">
                {isLoadingCache ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
                    Calcul de la taille du cache...
                  </div>
                ) : cacheSize ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-gray-400">Proxies vidéo :</span>
                      <span className="text-white text-sm" data-testid="proxies-size">
                        {formatGb(cacheSize.proxies_size_gb)}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-gray-400">Fichiers temporaires :</span>
                      <span className="text-white text-sm" data-testid="temp-size">
                        {formatGb(cacheSize.temp_size_gb)}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 pt-1 border-t border-gray-800">
                      <span className="text-sm text-gray-400 font-medium">Total :</span>
                      <span className="text-white text-sm font-medium" data-testid="total-size">
                        {formatGb(cacheSize.total_size_gb)}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-gray-500">Impossible de calculer la taille du cache.</span>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowClearConfirm(true)}
                disabled={isClearingCache || !cacheSize || cacheSize.total_size_gb === 0}
                data-testid="clear-cache-button"
              >
                {isClearingCache ? (
                  <>
                    <Loader2 aria-hidden="true" className="w-4 h-4 mr-1.5 animate-spin" />
                    Nettoyage...
                  </>
                ) : (
                  <>
                    <Trash2 aria-hidden="true" className="w-4 h-4 mr-1.5" />
                    Vider le cache
                  </>
                )}
              </Button>
            </div>

            {/* Section: Répertoire temporaire */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Répertoire temporaire</h3>
              <div className="rounded-md bg-gray-900 p-3 border border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Répertoire actuel :</span>
                  <span
                    className="text-white text-sm truncate max-w-[16.25rem]"
                    title={tempDirectory || '~/.splice/temp/ (par défaut)'}
                    data-testid="temp-dir-path"
                  >
                    {tempDirectory || '~/.splice/temp/ (par défaut)'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangeTempDir}
                  data-testid="change-temp-dir-button"
                >
                  <FolderOpen aria-hidden="true" className="w-4 h-4 mr-1.5" />
                  Changer
                </Button>
                {tempDirectory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetTempDir}
                    data-testid="reset-temp-dir-button"
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>
            </div>

            {/* Section: Mises à jour (rollback) */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Mises à jour</h3>

              {backupInfo ? (
                <div className="space-y-3">
                  <div className="rounded-md bg-gray-900 p-3 border border-gray-800 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-gray-400">Version sauvegardée :</span>
                      <span className="text-white font-medium" data-testid="backup-version">
                        v{backupInfo.version}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-gray-400">Date :</span>
                      <span className="text-white text-sm" data-testid="backup-date">
                        {backupInfo.backupDate}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-gray-400">Taille :</span>
                      <span className="text-white text-sm" data-testid="backup-size">
                        {backupInfo.sizeMb} Mo
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowRollbackConfirm(true)}
                    data-testid="rollback-button"
                  >
                    Revenir à v{backupInfo.version}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-500" data-testid="no-backup">
                  Aucune version précédente disponible.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear cache confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="max-w-xl p-0 gap-0 border-white/5 bg-card-dark">
          <AlertDialogHeader className="p-6 pb-4">
            <AlertDialogTitle>Vider le cache</AlertDialogTitle>
            <AlertDialogDescription>
              Tous les proxies vidéo et fichiers temporaires seront supprimés.
              Les projets existants continueront de fonctionner, mais les proxies devront être regénérés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-6 pt-0">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearCache} data-testid="confirm-clear-cache">
              Vider le cache
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rollback confirmation */}
      <AlertDialog open={showRollbackConfirm} onOpenChange={setShowRollbackConfirm}>
        <AlertDialogContent className="max-w-xl p-0 gap-0 border-white/5 bg-card-dark">
          <AlertDialogHeader className="p-6 pb-4">
            <AlertDialogTitle>Confirmer le rollback</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous revenir à la version v{backupInfo?.version} ? L'application va redémarrer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-6 pt-0">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRollback} data-testid="confirm-rollback">
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
