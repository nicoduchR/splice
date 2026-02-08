import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlobalKeyboardShortcuts } from './use-global-keyboard-shortcuts';

describe('useGlobalKeyboardShortcuts', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should open shortcuts dialog on Cmd+/', () => {
    const { result } = renderHook(() => useGlobalKeyboardShortcuts());

    expect(result.current.isShortcutsDialogOpen).toBe(false);

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: '/',
        metaKey: true,
      });
      window.dispatchEvent(event);
    });

    expect(result.current.isShortcutsDialogOpen).toBe(true);
  });

  it('should open shortcuts dialog on Ctrl+/', () => {
    const { result } = renderHook(() => useGlobalKeyboardShortcuts());

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: '/',
        ctrlKey: true,
      });
      window.dispatchEvent(event);
    });

    expect(result.current.isShortcutsDialogOpen).toBe(true);
  });

  it('should toggle dialog on repeated Cmd+/', () => {
    const { result } = renderHook(() => useGlobalKeyboardShortcuts());

    // Open
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', metaKey: true }));
    });
    expect(result.current.isShortcutsDialogOpen).toBe(true);

    // Close
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', metaKey: true }));
    });
    expect(result.current.isShortcutsDialogOpen).toBe(false);
  });

  it('should not open dialog when input is focused', () => {
    const { result } = renderHook(() => useGlobalKeyboardShortcuts());

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: '/',
        metaKey: true,
      });
      // Dispatch from focused input
      Object.defineProperty(event, 'target', { value: input });
      window.dispatchEvent(event);
    });

    expect(result.current.isShortcutsDialogOpen).toBe(false);

    document.body.removeChild(input);
  });

  it('should cleanup event listener on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useGlobalKeyboardShortcuts());

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('should provide openShortcutsDialog and closeShortcutsDialog callbacks', () => {
    const { result } = renderHook(() => useGlobalKeyboardShortcuts());

    act(() => {
      result.current.openShortcutsDialog();
    });
    expect(result.current.isShortcutsDialogOpen).toBe(true);

    act(() => {
      result.current.closeShortcutsDialog();
    });
    expect(result.current.isShortcutsDialogOpen).toBe(false);
  });
});
