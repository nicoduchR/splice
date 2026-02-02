import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export interface ModelMetadata {
  name: string;
  version: string;
  status: 'missing' | 'downloading' | 'ready' | 'corrupted';
  downloadUrl: string;
  totalSizeBytes: number;
  downloadedAt: number | null;
}

export interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
  speedMbps: number;
}

export class ModelService {
  /**
   * Vérifie le statut du modèle Parakeet
   */
  static async checkModelStatus(): Promise<ModelMetadata> {
    try {
      console.log('🔍 Invoking check_model_status command...');
      const result = await invoke<ModelMetadata>('check_model_status');
      console.log('✅ check_model_status returned:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to check model status:', error);
      throw new Error(`Échec de la vérification du modèle: ${error}`);
    }
  }

  /**
   * Lance le téléchargement du modèle Parakeet
   */
  static async downloadParakeetModel(): Promise<ModelMetadata> {
    try {
      return await invoke<ModelMetadata>('download_parakeet_model');
    } catch (error) {
      console.error('Failed to download model:', error);
      throw new Error(`Échec du téléchargement du modèle: ${error}`);
    }
  }

  /**
   * Annule le téléchargement en cours
   */
  static async cancelDownload(): Promise<void> {
    try {
      await invoke('cancel_model_download');
    } catch (error) {
      console.error('Failed to cancel download:', error);
      throw new Error(`Échec de l'annulation du téléchargement: ${error}`);
    }
  }

  /**
   * Écoute les événements de progression de téléchargement
   * @param callback Fonction appelée à chaque mise à jour de progression
   * @returns Fonction pour arrêter l'écoute
   */
  static async onDownloadProgress(
    callback: (progress: DownloadProgress) => void
  ): Promise<UnlistenFn> {
    return await listen<DownloadProgress>('model:download_progress', (event) => {
      callback(event.payload);
    });
  }
}
