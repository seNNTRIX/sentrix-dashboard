export function validateRange(start, end) {
 const from = Date.parse(start), to = Date.parse(end);
 if (!Number.isFinite(from) || !Number.isFinite(to)) return '시작과 끝 시간을 모두 입력하세요.';
 if (from >= to) return '끝 시간은 시작 시간보다 늦어야 합니다.';
 return '';
}
