// Original vector geometry for the Alder & Ember identity.
// All coordinates are plain numbers so the marks stay editable and reproducible.
// Units: symbol box is 64 x 64; ampersand box is 100 (cap height) tall, y down.

/** Closed polygon -> SVG path data */
export const poly = (pts) => 'M' + pts.map(([x, y]) => `${r(x)} ${r(y)}`).join('L') + 'Z';
const r = (n) => Math.round(n * 100) / 100;

/**
 * Outline of a polyline stroke with miter joins (bevel above the limit) and butt caps.
 * Straight segments only. Produces ONE closed polygon so it stays a real filled shape.
 */
export function strokePolyline(pts, w, miterLimit = 3) {
  const h = w / 2;
  const n = pts.length;
  const dirs = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    const len = Math.hypot(dx, dy);
    dirs.push([dx / len, dy / len]);
  }
  const normal = ([dx, dy]) => [-dy, dx];
  const left = [];
  const right = [];
  const join = (i, side) => {
    const p = pts[i];
    if (i === 0) {
      const [nx, ny] = normal(dirs[0]);
      return [[p[0] + side * nx * h, p[1] + side * ny * h]];
    }
    if (i === n - 1) {
      const [nx, ny] = normal(dirs[n - 2]);
      return [[p[0] + side * nx * h, p[1] + side * ny * h]];
    }
    const n1 = normal(dirs[i - 1]);
    const n2 = normal(dirs[i]);
    const mx = n1[0] + n2[0];
    const my = n1[1] + n2[1];
    const ml = Math.hypot(mx, my);
    const cos = (n1[0] * n2[0] + n1[1] * n2[1]);
    const miterLen = 1 / Math.sqrt((1 + cos) / 2); // ratio to h
    if (ml < 1e-6 || miterLen > miterLimit) {
      return [
        [p[0] + side * n1[0] * h, p[1] + side * n1[1] * h],
        [p[0] + side * n2[0] * h, p[1] + side * n2[1] * h],
      ];
    }
    const k = (h * miterLen) / ml;
    return [[p[0] + side * mx * k, p[1] + side * my * k]];
  };
  for (let i = 0; i < n; i++) left.push(...join(i, 1));
  for (let i = n - 1; i >= 0; i--) right.push(...join(i, -1));
  return poly([...left, ...right]);
}

// ---------------------------------------------------------------------------
// Direction C - "A / E construction" monogram (chosen).
// A slanted upright (A's left leg) and a vertical stem (A's right leg AND E's spine),
// one long bar that is both A's crossbar and E's middle arm, and two further E arms.
// ---------------------------------------------------------------------------
export const symbolC = {
  // structural parts, ember marks the shared bar (the "heat line")
  base: [
    poly([[7, 58], [16, 58], [44, 6], [36, 6]]), // slanted upright
    poly([[36, 6], [44, 6], [44, 58], [36, 58]]), // stem
    poly([[44, 6], [60, 6], [60, 14], [44, 14]]), // top arm
    poly([[44, 50], [60, 50], [60, 58], [44, 58]]), // bottom arm
  ],
  accent: [poly([[21, 33], [60, 33], [60, 41], [21, 41]])], // shared crossbar / middle arm
  viewBox: '0 0 64 64',
};

// Favicon treatment: fewer, heavier parts so it holds at 16 px.
export const faviconC = {
  base: [
    poly([[5, 60], [18, 60], [46, 4], [34, 4]]),
    poly([[34, 4], [46, 4], [46, 60], [34, 60]]),
    poly([[46, 4], [62, 4], [62, 16], [46, 16]]),
    poly([[46, 48], [62, 48], [62, 60], [46, 60]]),
  ],
  accent: [poly([[19, 30], [62, 30], [62, 42], [19, 42]])],
  viewBox: '0 0 64 64',
};

// ---------------------------------------------------------------------------
// Direction A - architectural wordmark with a cabin-elevation mark ("paired uprights").
// ---------------------------------------------------------------------------
export const symbolA = {
  base: [
    poly([[8, 8], [56, 8], [56, 14], [8, 14]]), // lintel
    poly([[8, 8], [15, 8], [15, 58], [8, 58]]), // left upright
    poly([[49, 8], [56, 8], [56, 58], [49, 58]]), // right upright
    poly([[8, 52], [56, 52], [56, 58], [8, 58]]), // sill
  ],
  accent: [poly([[27, 22], [37, 22], [37, 52], [27, 52]])], // the opening
  viewBox: '0 0 64 64',
};

// ---------------------------------------------------------------------------
// Direction B - timber and warmth: stepped boards with one small ember.
// ---------------------------------------------------------------------------
export const symbolB = {
  base: [
    poly([[8, 58], [20, 58], [20, 30], [8, 30]]),
    poly([[24, 58], [36, 58], [36, 18], [24, 18]]),
    poly([[40, 58], [52, 58], [52, 6], [40, 6]]),
  ],
  accent: [poly([[8, 20], [20, 20], [20, 26], [8, 26]])],
  viewBox: '0 0 64 64',
};
