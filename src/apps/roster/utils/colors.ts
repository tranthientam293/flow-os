const GOLDEN_ANGLE = 137.508;
const SATURATION = 0.62;
const LIGHTNESS = 0.5;

const toHex = (value: number) =>
  Math.round(value * 255)
    .toString(16)
    .padStart(2, "0");

function hslToHex(hue: number, s = SATURATION, l = LIGHTNESS): string {
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function hueOf(hex: string): number | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return null;
  const int = Number.parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  if (delta === 0) return null;
  const hue =
    max === r
      ? ((g - b) / delta) % 6
      : max === g
        ? (b - r) / delta + 2
        : (r - g) / delta + 4;
  return (hue * 60 + 360) % 360;
}

const hueDistance = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

function generatePalette(count: number, seed = 0): string[] {
  return Array.from({ length: count }, (_, i) =>
    hslToHex(((seed + i) * GOLDEN_ANGLE + 210) % 360),
  );
}

export function nextColor(used: readonly string[]): string {
  const usedHues = used.map(hueOf).filter((hue): hue is number => hue !== null);
  if (!usedHues.length) return generatePalette(1)[0];

  let best = 0;
  let bestDistance = -1;
  for (let hue = 0; hue < 360; hue += 5) {
    const distance = Math.min(...usedHues.map((u) => hueDistance(hue, u)));
    if (distance > bestDistance) {
      best = hue;
      bestDistance = distance;
    }
  }
  return hslToHex(best);
}
