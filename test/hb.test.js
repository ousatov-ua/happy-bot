import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HB_TEMPLATES,
  buildHbEmbed,
  handleHbCommand,
  isJulyFirst,
} from '../commands/hb.js';
import { discordCommandResponse } from '../discord.js';

test('hb exposes six templates', () => {
  assert.equal(HB_TEMPLATES.length, 6);
  assert.deepEqual(
    HB_TEMPLATES.map((template) => template.name),
    [
      'Birthday Card',
      'Achievement Unlocked',
      'Birthday Loot',
      'Birthday Spell',
      'Birthday Mission',
      'Birthday Fortune',
    ],
  );
});

test('hb date guard uses configured timezone', () => {
  assert.equal(isJulyFirst(new Date('2026-06-30T21:00:00Z'), 'Europe/Kyiv'), true);
  assert.equal(isJulyFirst(new Date('2026-06-30T20:59:59Z'), 'Europe/Kyiv'), false);
});

test('hb returns teaser outside July 1', async () => {
  const result = await handleHbCommand({}, {}, {
    now: new Date('2026-06-30T12:00:00Z'),
    timeZone: 'Europe/Kyiv',
  });
  assert.equal(result, '✨ Magic is coming. Check back on July 1.');

  const response = discordCommandResponse(result);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    type: 4,
    data: {
      content: '✨ Magic is coming. Check back on July 1.',
    },
  });
});

test('hb returns Discord embed on July 1', async () => {
  const result = await handleHbCommand({}, {}, {
    now: new Date('2026-07-01T12:00:00Z'),
    random: () => 0,
    timeZone: 'Europe/Kyiv',
  });

  assert.equal(result.embeds.length, 1);
  assert.equal(result.embeds[0].title, '🎂 З днем народження, Олежик!');
  assert.match(result.embeds[0].description, /Олежик/);
  assert.equal(result.embeds[0].footer.text, 'Birthday bot magic ✨');
  assert.equal(typeof result.embeds[0].color, 'number');
});

test('discordCommandResponse wraps embed payload', async () => {
  const response = discordCommandResponse({
    embeds: [buildHbEmbed(() => 0)],
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.type, 4);
  assert.equal(body.data.embeds.length, 1);
});
