export function css(value = '') {
 return Object.fromEntries(String(value).split(';').flatMap(d => {
  const i = d.indexOf(':'); if (i < 0) return [];
  const k = d.slice(0, i).trim();
  return [[k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), d.slice(i + 1).trim()]];
 }));
}
