export function computeAnalytics(params: {
  zonesCount: number;
  periodCount: number;
  taktLengthDays: number;
  assignments: Array<{ train_id: string; period_index: number }>;
}) {
  const { zonesCount, periodCount, taktLengthDays, assignments } = params;
  const totalCells = zonesCount * periodCount;
  const filled = assignments.length;
  const byTrain = assignments.reduce<Record<string, number>>((acc, a) => {
    acc[a.train_id] = (acc[a.train_id] ?? 0) + 1;
    return acc;
  }, {});
  const periodFilled = assignments.reduce<Record<number, number>>((acc, a) => {
    acc[a.period_index] = (acc[a.period_index] ?? 0) + 1;
    return acc;
  }, {});
  const idleZones = Array.from({ length: periodCount }, (_, p) => ({
    period: p,
    idle: zonesCount - (periodFilled[p] ?? 0)
  }));

  return {
    totalDurationDays: periodCount * taktLengthDays,
    flowEfficiency: totalCells ? filled / totalCells : 0,
    trainUtilization: Object.entries(byTrain).map(([trainId, count]) => ({
      trainId,
      utilization: totalCells ? count / totalCells : 0
    })),
    idleZones
  };
}
