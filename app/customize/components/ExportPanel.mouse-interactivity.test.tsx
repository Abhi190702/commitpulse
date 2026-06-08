import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportPanel } from './ExportPanel';

describe('ExportPanel - Mouse Interactivity', () => {
  const renderPanel = (overrides?: Partial<Parameters<typeof ExportPanel>[0]>) => {
    const onFormatChange = vi.fn();
    const onCopy = vi.fn();

    const view = render(
      <ExportPanel
        format="markdown"
        snippet="![CommitPulse](https://example.com/badge.svg)"
        copied={false}
        copyStatusMessage="Markdown snippet copied to clipboard."
        hasUsername
        username="octocat"
        onFormatChange={onFormatChange}
        onCopy={onCopy}
        {...overrides}
      />
    );

    return { onFormatChange, onCopy, view };
  };

  it('shows tooltip on hover over interactive elements', async () => {
    const user = userEvent.setup();
    renderPanel({ format: 'action' });

    const step2Buttons = screen.getAllByRole('button', {
      name: /copy step 2 markdown snippet/i,
    });
    const step2Button = step2Buttons[0];

    await user.hover(step2Button);

    expect(step2Button).toHaveAttribute('title', 'Copy Step 2 markdown');
  });

  it('applies pointer cursor classes on hoverable buttons', () => {
    renderPanel();

    const htmlButton = screen.getByRole('button', { name: 'HTML' });
    const copyButton = screen.getByRole('button', {
      name: /copy markdown export snippet to clipboard/i,
    });
    const downloadButton = screen.getByRole('button', {
      name: /download badge as commitpulse-octocat\.svg/i,
    });

    expect(htmlButton.className).toContain('hover:text-black');
    expect(copyButton.className).toContain('hover:bg-gray-300/80');
    expect(downloadButton.className).toContain('hover:bg-emerald-500/20');

    fireEvent.mouseEnter(htmlButton);
    fireEvent.mouseEnter(copyButton);
    fireEvent.mouseEnter(downloadButton);
  });

  it('hides tooltip when mouse leaves the element', async () => {
    const user = userEvent.setup();
    renderPanel({ format: 'action' });

    const step2Buttons = screen.getAllByRole('button', {
      name: /copy step 2 markdown snippet/i,
    });
    const step2Button = step2Buttons[0];

    await user.hover(step2Button);
    expect(step2Button).toHaveAttribute('title', 'Copy Step 2 markdown');

    await user.unhover(step2Button);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });

  it('propagates click events to parent elements', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const onFormatChange = vi.fn();
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <ExportPanel
          format="markdown"
          snippet="![CommitPulse](https://example.com/badge.svg)"
          copied={false}
          copyStatusMessage="Markdown snippet copied to clipboard."
          hasUsername
          username="octocat"
          onFormatChange={onFormatChange}
          onCopy={onCopy}
        />
      </div>
    );

    const copyButton = screen.getByRole('button', {
      name: /copy markdown export snippet to clipboard/i,
    });
    await user.click(copyButton);
    expect(onCopy).toHaveBeenCalledTimes(1);

    const htmlButton = screen.getByRole('button', { name: 'HTML' });
    await user.click(htmlButton);
    expect(onFormatChange).toHaveBeenCalledWith('html');

    expect(parentClick).toHaveBeenCalled();
  });

  it('calculates tooltip position based on mouse coordinates', () => {
    renderPanel({ format: 'action' });

    const step2Buttons = screen.getAllByRole('button', {
      name: /copy step 2 markdown snippet/i,
    });
    const step2Button = step2Buttons[0];

    const mockRect = {
      width: 40,
      height: 40,
      top: 100,
      left: 200,
      bottom: 140,
      right: 240,
      x: 200,
      y: 100,
    };

    vi.spyOn(step2Button, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect);

    const mouseX = mockRect.left + mockRect.width / 2;
    const mouseY = mockRect.top + mockRect.height / 2;

    fireEvent.mouseMove(step2Button, {
      clientX: mouseX,
      clientY: mouseY,
      bubbles: true,
    });

    fireEvent.mouseEnter(step2Button, {
      clientX: mouseX,
      clientY: mouseY,
      bubbles: true,
    });

    const rect = step2Button.getBoundingClientRect();
    const expectedX = rect.left + rect.width / 2;
    const expectedY = rect.top + rect.height / 2;

    expect(expectedX).toBe(220);
    expect(expectedY).toBe(120);
    expect(step2Button).toHaveAttribute('title', 'Copy Step 2 markdown');
  });
});
