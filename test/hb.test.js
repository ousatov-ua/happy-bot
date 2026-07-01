import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HB_TEMPLATES,
  buildHbEmbed,
  handleHbCommand,
  isJulyFirst,
} from '../commands/hb.js';
import { discordCommandResponse } from '../discord.js';

function interaction(username) {
  return {
    member: {
      user: { username },
    },
  };
}

test('hb exposes twelve templates', () => {
  assert.equal(HB_TEMPLATES.length, 12);
  assert.deepEqual(
    HB_TEMPLATES.map((template) => template.name),
    [
      'Birthday Card',
      'Досягнення відкрито',
      'Birthday Loot',
      'Birthday Spell',
      'Birthday Mission',
      'Birthday Fortune',
      'Birthday Raid',
      'Birthday Patch Notes',
      'Birthday Critical Hit',
      'Birthday Co-op',
      'Birthday Speedrun',
      'Birthday Tavern',
    ],
  );
});

test('hb descriptions render real line breaks', () => {
  for (const template of HB_TEMPLATES) {
    for (const description of template.description) {
      assert.doesNotMatch(description, /\\n/);
    }
  }
});

test('hb includes multiple achievement variants', () => {
  const achievement = HB_TEMPLATES.find((template) => template.name === 'Досягнення відкрито');

  assert.ok(achievement);
  assert.equal(achievement.title, '🏆 Досягнення відкрито');
  assert.equal(achievement.description.length, 8);
  assert.match(achievement.description.join('\n'), /Досягнення відкрито/);
  assert.match(achievement.description.join('\n'), /Платиновий трофей здобуто/);
  assert.doesNotMatch(
    achievement.description.join('\n'),
    /\b(Achievement|Rewards|Level|Secret|Birthday|Stats|Rare|Patch|Platinum|trophy|unlocked|buff|status|GG)\b/i,
  );
});

test('hb gifs are birthday celebration related', () => {
  const verifiedBirthdayGifIds = new Set([
    'IAXOTp0Q0hy8JpyYrb',
    'nJM1KhLzwQDoNXuyhc',
    'y5LmBG51luw2A0Llmj',
    'QOv8jYIvgTaYzCl5fs',
    'az6FZXG85pVyasjpgS',
    '3yAHkX2oW98oWFmcR8',
    'a8wmKpMbRDEllUZ464',
    'Q0QSGW9vAs4l6S3CPd',
    'ESR5LqfuZzN9usQhLk',
    'VEKxys8zRowZaCTJ9C',
    'DXhmNiA8F1i4fLnMdb',
    'g5R9dok94mrIvplmZd',
    'rrmf3fICPZWg1MMXOW',
    '9rO5Aksmn0dHQKXJAu',
  ]);

  for (const template of HB_TEMPLATES) {
    for (const image of template.images) {
      const gifId = image.match(/\/media\/([^/]+)\//)?.[1];
      assert.ok(verifiedBirthdayGifIds.has(gifId), `${template.name}: ${image}`);
    }
  }
});

test('hb date guard uses configured timezone', () => {
  assert.equal(isJulyFirst(new Date('2026-06-30T21:00:00Z'), 'Europe/Kyiv'), true);
  assert.equal(isJulyFirst(new Date('2026-06-30T20:59:59Z'), 'Europe/Kyiv'), false);
});

test('hb returns teaser outside July 1', async () => {
  const result = await handleHbCommand(interaction('gamervacuum'), {}, {
    now: new Date('2026-06-30T12:00:00Z'),
    timeZone: 'Europe/Kyiv',
  });
  assert.deepEqual(result, {
    content: '✨ Magic is coming. Check back on July 1.',
    flags: 64,
  });

  const response = discordCommandResponse(result);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    type: 4,
    data: {
      content: '✨ Magic is coming. Check back on July 1.',
      flags: 64,
    },
  });
});

test('hb returns Discord embed on July 1', async () => {
  const result = await handleHbCommand(interaction('gamervacuum'), {}, {
    now: new Date('2026-07-01T12:00:00Z'),
    random: () => 0,
    timeZone: 'Europe/Kyiv',
  });

  assert.equal(result.flags, 64);
  assert.equal(result.embeds.length, 1);
  assert.equal(result.embeds[0].title, '🎂 З днем народження, Олежик!');
  assert.match(result.embeds[0].description, /Олежик/);
  assert.equal(result.embeds[0].footer.text, 'Birthday bot magic ✨');
  assert.equal(typeof result.embeds[0].color, 'number');
});

test('hb allows oleksii.usatov privately', async () => {
  const result = await handleHbCommand(interaction('oleksii.usatov'), {}, {
    now: new Date('2026-07-01T12:00:00Z'),
    random: () => 0,
    timeZone: 'Europe/Kyiv',
  });

  assert.equal(result.flags, 64);
  assert.equal(result.embeds.length, 1);
});

test('hb rejects users outside allowlist', async () => {
  const result = await handleHbCommand(interaction('somebody'), {}, {
    now: new Date('2026-07-01T12:00:00Z'),
    timeZone: 'Europe/Kyiv',
  });

  assert.deepEqual(result, { content: '⛔ You cannot use /hb.', flags: 64 });
});

test('discordCommandResponse wraps embed payload', async () => {
  const response = discordCommandResponse({
    embeds: [buildHbEmbed(() => 0)],
    flags: 64,
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.type, 4);
  assert.equal(body.data.flags, 64);
  assert.equal(body.data.embeds.length, 1);
});
