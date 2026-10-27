import { test } from 'node:test';
import assert from 'node:assert/strict';
import { routeHref } from '../src/styles.js';
import { validateRange } from '../src/time-range.js';
test('design routes work as native links while external and hash destinations stay intact', () => {
 assert.equal(routeHref('B4-Incident.dc.html'),'#B4-Incident');
 assert.equal(routeHref('#B1-Overview'),'#B1-Overview');
 assert.equal(routeHref('https://example.com/help'),'https://example.com/help');
});
test('custom time range rejects missing, equal and reversed timestamps', () => {
 assert.notEqual(validateRange('', '2026-10-27T14:30'),'');
 assert.notEqual(validateRange('2026-10-27T14:30','2026-10-27T14:30'),'');
 assert.notEqual(validateRange('2026-10-27T15:00','2026-10-27T14:30'),'');
 assert.equal(validateRange('2026-10-27T14:00','2026-10-27T14:30'),'');
});
