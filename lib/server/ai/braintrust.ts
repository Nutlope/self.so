import {
  initLogger,
  type ExperimentLogPartialArgs,
  type Logger,
  type Span,
  type StartSpanArgs,
} from 'braintrust';
import { after } from 'next/server';

let logger: Logger<true> | null | undefined;

function getBraintrustLogger() {
  if (!process.env.BRAINTRUST_API_KEY) return undefined;

  if (logger !== undefined) {
    return logger ?? undefined;
  }

  try {
    logger = initLogger({
      apiKey: process.env.BRAINTRUST_API_KEY,
      projectName: process.env.BRAINTRUST_PROJECT ?? 'self-so',
      asyncFlush: true,
    });
  } catch (error) {
    logger = null;
    console.warn('Braintrust logger initialization failed:', error);
  }

  return logger ?? undefined;
}

export function startBraintrustSpan(args: StartSpanArgs) {
  try {
    return getBraintrustLogger()?.startSpan(args);
  } catch (error) {
    console.warn('Braintrust span initialization failed:', error);
    return undefined;
  }
}

export function logBraintrustEvent(
  span: Span | undefined,
  event: ExperimentLogPartialArgs
) {
  try {
    span?.log(event);
  } catch (error) {
    console.warn('Braintrust span logging failed:', error);
  }
}

export function endAndFlushBraintrustSpanAfterResponse(span: Span | undefined) {
  if (!span) return;

  try {
    span.end();
  } catch (error) {
    console.warn('Braintrust span finalization failed:', error);
    return;
  }

  try {
    after(async () => {
      try {
        await span.flush();
      } catch (error) {
        console.warn('Braintrust span flush failed:', error);
      }
    });
  } catch (error) {
    console.warn('Braintrust span flush scheduling failed:', error);
  }
}

export function serializeBraintrustError(error: unknown) {
  const errorRecord =
    typeof error === 'object' && error !== null
      ? (error as Record<string, unknown>)
      : undefined;
  const statusCode = errorRecord?.statusCode;
  const retryable = errorRecord?.isRetryable;

  let category = 'generation_error';
  if (!(error instanceof Error)) {
    category = 'unknown_error';
  } else if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    category = 'timeout';
  } else if (error.name === 'AI_APICallError') {
    category = 'provider_api_error';
  } else if (
    error.name === 'AI_NoObjectGeneratedError' ||
    error.name === 'AI_JSONParseError' ||
    error.name === 'AI_TypeValidationError' ||
    error.name === 'AI_InvalidResponseDataError' ||
    error.name === 'AI_NoContentGeneratedError'
  ) {
    category = 'invalid_model_output';
  }

  return {
    category,
    ...(typeof statusCode === 'number' &&
    Number.isInteger(statusCode) &&
    statusCode >= 100 &&
    statusCode <= 599
      ? { statusCode }
      : {}),
    ...(typeof retryable === 'boolean' ? { retryable } : {}),
  };
}
