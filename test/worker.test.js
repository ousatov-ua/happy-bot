import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../index.js';
import { handleSlashCommand } from '../commands/index.js';
import { discordCommandResponse } from '../discord.js';

test('worker module exports Cloudflare fetch handler', () => {
  assert.equal(typeof worker.fetch, 'function');
});

test('slash router ignores unknown commands', async () => {
  const result = await handleSlashCommand({ data: { name: 'unknown' } }, {});
  assert.equal(result, undefined);
});

test('discord response preserves ephemeral flags', async () => {
  const response = discordCommandResponse({ content: 'secret', flags: 64 });
  assert.deepEqual(await response.json(), {
    type: 4,
    data: { content: 'secret', flags: 64 },
  });
});
