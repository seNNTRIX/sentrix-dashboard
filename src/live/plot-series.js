// Keep real samples in solid runs. Only a short gap bounded by readings gets a dotted guide.
export function splitSeries(points, stepMs) {
  const runs = [], bridges = [];
  let previous, missing = 0, run;
  for (const point of points) {
    if (!Number.isFinite(point.t)) continue;
    if (!Number.isFinite(point.value)) {
      missing++;
      continue;
    }
    const elapsed = previous ? point.t - previous.t : 0;
    const skipped = stepMs > 0 ? Math.max(0, Math.round(elapsed / stepMs) - 1) : 0;
    if (!previous || missing || skipped) {
      if (previous && elapsed > 0 && stepMs > 0 && elapsed <= 3 * stepMs && Math.max(missing, skipped) <= 2) {
        bridges.push([previous, point]);
      }
      run = [];
      runs.push(run);
    }
    run.push(point);
    previous = point;
    missing = 0;
  }
  return {runs, bridges};
}

// The overview trend connects observed scores in time order, without inventing missing samples.
export function scoreSamples(points) {
  return points.filter(point=>Number.isFinite(point.t) && Number.isFinite(point.value));
}

// Place tick labels, readings and the threshold on the same padded plot area.
export function scoreY(value, maximum) {
  return 148 - 134 * value / maximum;
}
