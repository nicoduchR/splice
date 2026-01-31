// Global type declarations for the Splice Desktop app

declare global {
  interface Window {
    /**
     * Tauri internals object - only available when running in Tauri context (v2.0+)
     * Use this to check if running in Tauri vs browser dev mode
     */
    __TAURI_INTERNALS__?: {
      [key: string]: unknown;
    };

    /**
     * Legacy Tauri API object (v1.x)
     * @deprecated Use __TAURI_INTERNALS__ for Tauri 2.0+
     */
    __TAURI__?: {
      [key: string]: unknown;
    };
  }
}

export {};
