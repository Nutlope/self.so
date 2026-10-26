export type ReadJsonBodyResult =
  | { ok: true; data: unknown }
  | { ok: false; status: 400 | 413; error: string };

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<ReadJsonBodyResult> {
  const tooLarge = {
    ok: false,
    status: 413,
    error: 'Request body too large',
  } as const;

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return tooLarge;
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return tooLarge;
  }

  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON body' };
  }
}
