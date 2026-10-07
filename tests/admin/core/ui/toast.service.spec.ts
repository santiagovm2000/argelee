import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOAST_DURATION_MS } from '@admin/core/config/admin.constants';
import { T } from '@admin/core/i18n/translation-keys.generated';
import { ToastService } from '@admin/core/ui/toast.service';

const PUBLISHED = { key: T.post.publish.published, params: { account: 'arg_eles' } };
const SAVED = { key: T.pdf.current };

describe('ToastService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a notice and lets it go on its own', () => {
    const toast = new ToastService();
    toast.show(PUBLISHED);
    expect(toast.message()).toEqual(PUBLISHED);
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
    expect(toast.message()).toEqual(PUBLISHED);
    vi.advanceTimersByTime(1);
    expect(toast.message()).toBeNull();
  });

  it('gives a second notice its full time instead of the first one’s remainder', () => {
    const toast = new ToastService();
    toast.show(PUBLISHED);
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
    toast.show(SAVED);
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
    expect(toast.message()).toEqual(SAVED);
    vi.advanceTimersByTime(1);
    expect(toast.message()).toBeNull();
  });
});
