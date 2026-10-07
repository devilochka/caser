export function cubicBezier(x1, y1, x2, y2) {
  const curve = (t, a, b) =>
    3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;
  return (progress) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    let low = 0,
      high = 1,
      t = progress;
    for (let n = 0; n < 24; n++) {
      if (curve(t, x1, x2) < progress) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return curve(t, y1, y2);
  };
}
