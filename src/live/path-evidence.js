// Stored RCA results keep measurements in the model's evidence strings. Each
// supported format identifies a percentile, a unit, and the order of the pair.
const measuredPath = /^분석 기준 · 수신 처리 외 p(90|99)이 (\d+(?:\.\d)?) → (\d+(?:\.\d)?) ms로 늘었고, 같은 호출의 수신 처리 시간은 (\d+(?:\.\d)?) → (\d+(?:\.\d)?) ms였습니다\.$/;
const legacyTail = /^호출 지연 p99 (\d+(?:\.\d)?) → (\d+(?:\.\d)?) ms, 수신 처리 외 시간 p99 (\d+(?:\.\d)?) → (\d+(?:\.\d)?) ms$/;
const legacyP90 = /^호출 지연 p90 (\d+(?:\.\d)?) ms → (\d+(?:\.\d)?) ms$/;

function measurement(label, before, current) {
  return {
    label, before: Number(before), current: Number(current), unit: 'ms',
    digits: Math.max((before.split('.')[1] || '').length, (current.split('.')[1] || '').length),
  };
}

export function pathEvidenceComparison(candidate) {
  if (candidate?.kind !== 'EDGE' || !candidate.source || !candidate.target || !Array.isArray(candidate.evidence)) return null;
  const evidence = candidate.evidence.filter(line => typeof line === 'string');
  // A routed candidate can also include the legacy measurements. Prefer the
  // paired measurement that actually selected this path, even when it uses p90.
  for (const pattern of [measuredPath, legacyTail, legacyP90]) {
    for (const line of evidence) {
      const match = pattern.exec(line);
      if (!match) continue;
      let percentile, rows;
      if (pattern === measuredPath) {
        percentile = Number(match[1]);
        rows = [measurement('수신 처리 외 지연', match[2], match[3]), measurement('수신 처리 시간', match[4], match[5])];
      } else if (pattern === legacyTail) {
        percentile = 99;
        rows = [measurement('수신 처리 외 지연', match[3], match[4]), measurement('호출 지연', match[1], match[2])];
      } else {
        percentile = 90;
        rows = [measurement('호출 지연', match[1], match[2])];
      }
      if (rows.every(row => Number.isFinite(row.before) && Number.isFinite(row.current))) {
        return {percentile, rows};
      }
    }
  }
  return null;
}
