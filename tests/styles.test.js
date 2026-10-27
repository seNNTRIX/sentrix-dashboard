import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css } from '../src/styles.js';
test('design styles preserve custom properties, SVG and values containing colons', () => {
 assert.deepEqual(css('--size: 4px; stroke-width: 1.5; background: url(https://example.com/a);'), {'--size':'4px',strokeWidth:'1.5',background:'url(https://example.com/a)'});
 assert.deepEqual(css(), {});
});
