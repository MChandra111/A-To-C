/** Run an async handler from a click/submit event without unhandled rejections. */
export function runAsync(
  action: () => Promise<void>,
  onError?: (error: unknown) => void
): void {
  void action().catch((error) => {
    if (onError) {
      onError(error);
      return;
    }
    console.error(error);
  });
}
