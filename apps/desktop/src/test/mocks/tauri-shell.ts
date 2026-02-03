/**
 * Mock for @tauri-apps/plugin-shell
 * Used in tests to avoid importing native Tauri modules
 */
export const open = async (_url: string): Promise<void> => {
  // Mock implementation - does nothing in tests
};
