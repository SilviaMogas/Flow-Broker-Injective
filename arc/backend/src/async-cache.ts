export function createAsyncCache<T>(
  load: () => Promise<T>,
  ttlMs: number,
  healthy: (value: T) => boolean = () => true,
  now = Date.now,
) {
  let value: T;
  let expiresAt = 0;
  let inFlight: Promise<T> | undefined;

  return async () => {
    if (inFlight) return inFlight;
    if (now() < expiresAt) return value;
    inFlight = load().then((result) => {
      value = result;
      expiresAt = now() + (healthy(result) ? ttlMs : 5_000);
      return result;
    }).finally(() => {
      inFlight = undefined;
    });
    return inFlight;
  };
}
