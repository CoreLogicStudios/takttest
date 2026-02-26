export type Zone = { id: string };
export type Train = { id: string };

export function generateDiagonal(zones: Zone[], trains: Train[], periodCount: number) {
  const out: Array<{ zone_id: string; period_index: number; train_id: string }> = [];
  zones.forEach((z, zi) => {
    trains.forEach((t, ti) => {
      const period = zi + ti;
      if (period < periodCount) out.push({ zone_id: z.id, period_index: period, train_id: t.id });
    });
  });
  return out;
}
