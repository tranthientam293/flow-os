type Interval = { id: string; start: number; end: number };

export type Placement = { column: number; columns: number };

// Where a block sits inside its day column, in percent. Like Google Calendar,
// overlapping blocks cascade: each later one starts further right, reaches
// further than its share, and sits on top of the ones before it.
export function cascade({ column, columns }: Placement) {
  const share = 100 / columns;
  const left = column * share;
  const width =
    column === columns - 1 ? share : Math.min(100 - left, share * 1.7);
  return { left, width, zIndex: column + 1 };
}

export function layoutOverlaps(items: Interval[]): Map<string, Placement> {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const result = new Map<string, Placement>();
  let group: { id: string; column: number }[] = [];
  let columnEnds: number[] = [];
  let groupEnd = -Infinity;

  const flush = () => {
    for (const entry of group)
      result.set(entry.id, {
        column: entry.column,
        columns: columnEnds.length,
      });
    group = [];
    columnEnds = [];
  };

  for (const item of sorted) {
    if (item.start >= groupEnd) {
      flush();
      groupEnd = -Infinity;
    }
    let column = columnEnds.findIndex((end) => end <= item.start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(item.end);
    } else {
      columnEnds[column] = item.end;
    }
    group.push({ id: item.id, column });
    groupEnd = Math.max(groupEnd, item.end);
  }
  flush();
  return result;
}

export type PopupPlacement =
  | "right"
  | "left"
  | "bottom"
  | "top"
  | "rightTop"
  | "rightBottom"
  | "leftTop"
  | "leftBottom";

// Picks the side of `target` with room for a popup of about `width` × `height`
// px, so it stays on screen: right, then left, then below or above. Near the
// top or bottom edge a side popup aligns to that edge of the target.
export function popupPlacement(
  target: DOMRect,
  width: number,
  height: number,
): PopupPlacement {
  const gap = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const side =
    vw - target.right >= width + gap
      ? "right"
      : target.left >= width + gap
        ? "left"
        : null;
  if (side) {
    const middle = target.top + target.height / 2;
    if (middle - height / 2 < gap) return `${side}Top`;
    if (middle + height / 2 > vh - gap) return `${side}Bottom`;
    return side;
  }
  return vh - target.bottom >= height + gap || target.top < vh - target.bottom
    ? "bottom"
    : "top";
}
