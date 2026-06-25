import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useShareActions } from './useShareActions';
import type { DashboardExportData } from '@/types/dashboard';

const mockUsername = 'testuser';
const mockExportData: DashboardExportData = {
  stats: { totalContributions: 10, currentStreak: 3, peakStreak: 5 },
  activity: [],
  languages: [],
};
const mockOnClose = vi.fn();
const url = 'https://commitpulse.app/testuser';

vi.mock('@/utils/urls', () => ({
  getDashboardUrl: () => url,
  getOrigin: () => 'https://commitpulse.app',
}));

describe('useShareActions error logging', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnClose.mockReset();
    document.body.innerHTML = '';
    Reflect.deleteProperty(globalThis, 'fetch');
    Reflect.deleteProperty(globalThis, 'ClipboardItem');
  });

  it('handleCopyLink calls navigator.clipboard.writeText with a profile URL containing the username', async () => {
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    let success;
    await act(async () => {
      success = await result.current.handleCopyLink();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining(`/dashboard/${mockUsername}`)
    );
    expect(success).toBe(true);
    expect(result.current.states['copy']).toBe('success');
  });

  it('resets copy state to idle after 2500ms', async () => {
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    await act(async () => {
      await result.current.handleCopyLink();
    });

    expect(result.current.states['copy']).toBe('success');

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.states['copy']).toBe('idle');
  });

  it('copies dashboard image to clipboard successfully', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined);
    class MockClipboardItem {
      constructor(public data: Record<string, Blob>) {}
    }

    Object.defineProperty(globalThis, 'ClipboardItem', {
      value: MockClipboardItem,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        write: writeMock,
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });

    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    await act(async () => {
      const promise = result.current.handleCopyImage();
      await vi.advanceTimersByTimeAsync(150);
      await promise;
    });

    expect(writeMock).toHaveBeenCalled();
    expect(result.current.states['copyImage']).toBe('success');
  });

  it('handleTwitter opens window to share on twitter/x', () => {
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    act(() => {
      result.current.handleTwitter();
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'noopener'
    );
    expect(mockClose).toHaveBeenCalled();
  });

  it('handleLinkedIn opens window to share on linkedin', () => {
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockClose));

    act(() => {
      result.current.handleLinkedIn();
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com/sharing/share-offsite'),
      '_blank',
      'noopener'
    );
    expect(mockClose).toHaveBeenCalled();
  });

  it('logs error when handleCopyLink fails', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('permission denied')) },
    });
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await result.current.handleCopyLink();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[useShareActions] copy link failed:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('logs error when handleDownloadPNG fails', async () => {
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await result.current.handleDownloadPNG();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[useShareActions] PNG download failed:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('logs error when handleCopyMarkdown fails', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('clipboard error')) },
    });
    const { result } = renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await result.current.handleCopyMarkdown();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[useShareActions] copy markdown failed:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});
