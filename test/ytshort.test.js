import assert from 'node:assert/strict';
import test from 'node:test';

import {
  YT_SHORT_KEYWORDS,
  buildYtShortSearchQuery,
  handleYtShortCommand,
  selectYtShortKeyword,
} from '../commands/ytshort.js';

test('ytshort keywords use requested weights', () => {
  assert.deepEqual(YT_SHORT_KEYWORDS, [
    { query: 'cats', weight: 0.9 },
    { query: 'dogs', weight: 0.8 },
    { query: 'animals', weight: 0.7 },
    { query: 'funny fails', weight: 0.8 },
    { query: 'harmless scare pranks', weight: 0.7 },
    { query: 'LGNDEDITZ style edits', weight: 0.6 },
    { query: 'animal reactions', weight: 0.5 },
    { query: 'baby animals', weight: 0.5 },
    { query: 'farm animals', weight: 0.5 },
    { query: 'wild animals', weight: 0.5 },
  ]);
});

test('ytshort weighted selector respects keyword weights', () => {
  const totalWeight = YT_SHORT_KEYWORDS.reduce(
    (sum, keyword) => sum + keyword.weight,
    0,
  );

  assert.equal(selectYtShortKeyword(() => 0), 'cats');
  assert.equal(selectYtShortKeyword(() => 0.91 / totalWeight), 'dogs');
  assert.equal(selectYtShortKeyword(() => 5.1 / totalWeight), 'baby animals');
});

test('ytshort search query forces funny family-friendly shorts', () => {
  assert.equal(
    decodeURIComponent(buildYtShortSearchQuery('cats')),
    'cats funny clean family friendly #shorts',
  );
});

test('ytshort command responds only to the requesting user', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    async json() {
      return { items: [] };
    },
  });

  try {
    assert.deepEqual(
      await handleYtShortCommand({}, { YOUTUBE_API_KEY: 'test' }),
      {
        content: '⚠️ No new shorts found matching the random query. Try again!',
        flags: 64,
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
