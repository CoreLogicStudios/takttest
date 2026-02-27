export type AssignmentLite = { zone_id: string; period_index: number; train_id: string };

const key = (z: string, p: number) => `${z}:${p}`;

export function shiftSelected(
  assignments: AssignmentLite[],
  selected: Array<{ zone_id: string; period_index: number }>,
  delta: number,
  periodCount: number
) {
  const selectedSet = new Set(selected.map((s) => key(s.zone_id, s.period_index)));
  const occupied = new Set(assignments.map((a) => key(a.zone_id, a.period_index)));
  const moves: Array<{ from: AssignmentLite; toPeriod: number }> = [];
  const collisions: string[] = [];

  for (const a of assignments) {
    if (!selectedSet.has(key(a.zone_id, a.period_index))) continue;
    const toPeriod = a.period_index + delta;
    if (toPeriod < 0 || toPeriod >= periodCount) {
      collisions.push(key(a.zone_id, toPeriod));
      continue;
    }
    const destKey = key(a.zone_id, toPeriod);
    if (occupied.has(destKey) && !selectedSet.has(destKey)) collisions.push(destKey);
    else moves.push({ from: a, toPeriod });
  }

  return { moves, collisions };
}

export function shiftTrainFromHere(
  assignments: AssignmentLite[],
  trainId: string,
  startPeriod: number,
  delta: number,
  periodCount: number
) {
  const occupied = new Set(assignments.map((a) => key(a.zone_id, a.period_index)));
  const moving = assignments.filter((a) => a.train_id === trainId && a.period_index >= startPeriod);
  const movingKeys = new Set(moving.map((m) => key(m.zone_id, m.period_index)));
  const moves: Array<{ from: AssignmentLite; toPeriod: number }> = [];
  const collisions: string[] = [];

  for (const a of moving) {
    const toPeriod = a.period_index + delta;
    if (toPeriod < 0 || toPeriod >= periodCount) {
      collisions.push(key(a.zone_id, toPeriod));
      continue;
    }
    const destKey = key(a.zone_id, toPeriod);
    if (occupied.has(destKey) && !movingKeys.has(destKey)) collisions.push(destKey);
    else moves.push({ from: a, toPeriod });
  }
  return { moves, collisions };
}
