import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const path = new URL('../index.html', import.meta.url);

test('LifeMap shell exposes all life-event layers and primary actions', async () => {
  const html = await readFile(path, 'utf8');
  for (const token of [
    'data-layer="jobs"',
    'data-layer="housing"',
    'data-layer="community"',
    'data-layer="move"',
    'data-layer="mobility"',
    'data-layer="finance"',
    'id="quick-import-form"',
    'id="review-modal"',
    'id="entity-drawer"',
    'id="journey-panel"',
    'id="profile-panel"',
  ]) assert.ok(html.includes(token), `missing ${token}`);
});

test('LifeMap labels demo data separately from external data', async () => {
  const html = await readFile(path, 'utf8');
  assert.ok(html.includes('DEMO DATA'));
  assert.ok(html.includes('데이터 출처'));
});
