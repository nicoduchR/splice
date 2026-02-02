import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentationProgressDialog } from './SegmentationProgressDialog';

describe('SegmentationProgressDialog', () => {
  const defaultProgress = {
    project_id: 'project-1',
    current_segment: 5,
    total_segments: 23,
    progress: 0.217,
  };

  it('displays current segment info', () => {
    render(
      <SegmentationProgressDialog
        isOpen={true}
        progress={defaultProgress}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Traitement du segment 5/23')).toBeInTheDocument();
  });

  it('displays progress bar for >10 segments', () => {
    render(
      <SegmentationProgressDialog
        isOpen={true}
        progress={defaultProgress}
        onCancel={vi.fn()}
      />
    );

    // Should show percentage
    expect(screen.getByText('22%')).toBeInTheDocument();
  });

  it('displays spinner for <=10 segments', () => {
    const smallProgress = { ...defaultProgress, total_segments: 5, current_segment: 2 };
    render(
      <SegmentationProgressDialog
        isOpen={true}
        progress={smallProgress}
        onCancel={vi.fn()}
      />
    );

    // Should have spinner (animate-spin class) — portaled to document.body
    expect(document.querySelector('.animate-spin')).toBeTruthy();
    // Should NOT show percentage
    expect(screen.queryByText('40%')).not.toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <SegmentationProgressDialog
        isOpen={true}
        progress={defaultProgress}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByText('Annuler'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows title', () => {
    render(
      <SegmentationProgressDialog
        isOpen={true}
        progress={defaultProgress}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Génération des cuts vidéo...')).toBeInTheDocument();
  });

  it('shows validation title when isValidating is true', () => {
    render(
      <SegmentationProgressDialog
        isOpen={true}
        progress={defaultProgress}
        isValidating={true}
        validationProgress={{ project_id: 'project-1', current_segment: 2, total_segments: 5 }}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Validation des segments...')).toBeInTheDocument();
    expect(screen.getByText('Validation du segment 2/5')).toBeInTheDocument();
  });

  it('shows segmentation title when isValidating is false', () => {
    render(
      <SegmentationProgressDialog
        isOpen={true}
        progress={defaultProgress}
        isValidating={false}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Génération des cuts vidéo...')).toBeInTheDocument();
  });
});
