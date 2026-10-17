/** Pointer position as a transform-origin percentage (0–100) inside the frame. */
export function zoomOrigin(
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const pct = (offset: number, size: number) =>
    Math.min(100, Math.max(0, (offset / size) * 100));

  return { x: pct(clientX - rect.left, rect.width), y: pct(clientY - rect.top, rect.height) };
}
