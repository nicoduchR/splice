import { invoke } from '@tauri-apps/api/core';

type LogLevel = 'error' | 'warn' | 'info';

async function writeLog(level: LogLevel, context: string, message: string): Promise<void> {
  try {
    await invoke('log_frontend_error', { level, context, message });
  } catch {
    // Fire-and-forget: if Tauri is not available (e.g., tests, browser mode),
    // silently fall back to console
    if (level === 'error') {
      console.error(`[${context}] ${message}`);
    }
  }
}

export function logError(context: string, error: unknown): void {
  const message = error instanceof Error
    ? `${error.message}\n${error.stack || ''}`
    : String(error);
  writeLog('error', context, message);
}

export function logWarn(context: string, message: string): void {
  writeLog('warn', context, message);
}

export function logInfo(context: string, message: string): void {
  writeLog('info', context, message);
}
