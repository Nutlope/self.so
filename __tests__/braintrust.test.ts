import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Span } from 'braintrust';

const { afterMock } = vi.hoisted(() => ({
  afterMock: vi.fn(),
}));

vi.mock('next/server', () => ({
  after: afterMock,
}));

import { endAndFlushBraintrustSpanAfterResponse } from '@/lib/server/ai/braintrust';

describe('Braintrust serverless lifecycle', () => {
  beforeEach(() => {
    afterMock.mockReset();
  });

  it('ends the span now and flushes it after the response', async () => {
    let scheduledFlush: (() => Promise<void>) | undefined;
    afterMock.mockImplementation((callback) => {
      scheduledFlush = callback;
    });
    const span = {
      end: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined),
    } as unknown as Span;

    endAndFlushBraintrustSpanAfterResponse(span);

    expect(span.end).toHaveBeenCalledOnce();
    expect(afterMock).toHaveBeenCalledOnce();
    expect(span.flush).not.toHaveBeenCalled();

    await scheduledFlush?.();

    expect(span.flush).toHaveBeenCalledOnce();
  });
});
