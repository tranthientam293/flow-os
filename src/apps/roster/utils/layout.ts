type Interval = { id: string; start: number; end: number };

export type Placement = { column: number; columns: number };

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
