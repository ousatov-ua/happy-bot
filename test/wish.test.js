import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COMMAND_ROUTER,
} from '../commands/index.js';
import {
  handleWishCommand,
  handleWishDelCommand,
  handleWishListIdsCommand,
  handleWishesCommand,
} from '../commands/wish.js';

function createKv() {
  const entries = new Map();

  return {
    entries,
    async get(key) {
      return entries.get(key) ?? null;
    },
    async put(key, value) {
      entries.set(key, value);
    },
    async delete(key) {
      entries.delete(key);
    },
    async list({ prefix }) {
      return {
        keys: [...entries.keys()]
          .filter((key) => key.startsWith(prefix))
          .map((name) => ({ name })),
        list_complete: true,
      };
    },
  };
}

function interaction(username, command, options = []) {
  return {
    data: {
      name: command,
      options,
    },
    member: {
      user: { username },
    },
  };
}

test('wish stores text with unicode smiles for allowed users', async () => {
  const WISHES = createKv();
  const result = await handleWishCommand(
    interaction('somebody', 'wish', [{ name: 'anything', type: 3, value: 'З днем народження 🎂' }]),
    { WISHES },
    {
      now: new Date('2026-07-01T09:00:00.000Z'),
      randomUUID: () => 'wish-1',
    },
  );

  assert.deepEqual(result, {
    content: '✅ Побажання збережено. id: 1782896400000-wish-1',
    flags: 64,
  });
  assert.deepEqual(JSON.parse(await WISHES.get('wish:1782896400000-wish-1')), {
    user: 'somebody',
    text: 'З днем народження 🎂',
    createdAt: '2026-07-01T09:00:00.000Z',
  });
});

test('wish id default randomUUID works in runtime context', async () => {
  const WISHES = createKv();
  const result = await handleWishCommand(
    interaction('somebody', 'wish', [{ name: 'text', value: 'З днем народження' }]),
    { WISHES },
  );

  assert.equal(result.flags, 64);
  assert.match(result.content, /^✅ Побажання збережено\. id: \d+-/);
  assert.equal(WISHES.entries.size, 1);
});

test('wish commands are routed with expected names', () => {
  assert.equal(COMMAND_ROUTER.wish, handleWishCommand);
  assert.equal(COMMAND_ROUTER.wishes, handleWishesCommand);
  assert.equal(COMMAND_ROUTER['wish-list'], undefined);
  assert.equal(COMMAND_ROUTER['wish-list-ids'], handleWishListIdsCommand);
  assert.equal(COMMAND_ROUTER['wish-del'], handleWishDelCommand);
  assert.equal(COMMAND_ROUTER['whish-list'], undefined);
});

test('wish rejects gamervacuum', async () => {
  const WISHES = createKv();
  const result = await handleWishCommand(
    interaction('gamervacuum', 'wish', [{ name: 'text', value: 'hello' }]),
    { WISHES },
  );

  assert.deepEqual(result, { content: '⛔ You cannot use /wish.', flags: 64 });
  assert.equal(WISHES.entries.size, 0);
});

test('wishes returns birthday gif embeds for allowed users only', async () => {
  const WISHES = createKv();
  await handleWishCommand(
    interaction('friend', 'wish', [{ name: 'text', value: 'З днем народження, Олег!' }]),
    { WISHES },
    {
      now: new Date('2026-07-01T09:00:00.000Z'),
      randomUUID: () => 'wish-1',
    },
  );

  assert.deepEqual(
    await handleWishesCommand(interaction('friend', 'wishes'), { WISHES }),
    { content: '⛔ You cannot use /wishes.', flags: 64 },
  );

  const result = await handleWishesCommand(interaction('gamervacuum', 'wishes'), { WISHES });
  assert.equal(result.flags, 64);
  assert.equal(result.embeds.length, 1);
  assert.equal(
    result.embeds[0].description,
    'Побажання від friend: З днем народження, Олег!',
  );
  assert.match(result.embeds[0].thumbnail.url, /^https:\/\/media\.giphy\.com\//);
  assert.equal(
    (await handleWishesCommand(interaction('oleksii.usatov', 'wishes'), { WISHES })).embeds.length,
    1,
  );
});

test('gamervacuum cannot list or delete wishes', async () => {
  const WISHES = createKv();
  await handleWishCommand(
    interaction('friend', 'wish', [{ name: 'text', value: 'З днем народження!' }]),
    { WISHES },
    {
      now: new Date('2026-07-01T09:00:00.000Z'),
      randomUUID: () => 'wish-1',
    },
  );

  assert.equal(COMMAND_ROUTER['wish-list'], undefined);
  assert.deepEqual(
    await handleWishListIdsCommand(interaction('gamervacuum', 'wish-list-ids'), { WISHES }),
    { content: '⛔ You cannot use /wish-list-ids.', flags: 64 },
  );

  assert.deepEqual(
    await handleWishDelCommand(
      interaction('gamervacuum', 'wish-del', [{ name: 'id', value: '1782896400000-wish-1' }]),
      { WISHES },
    ),
    { content: '⛔ You cannot use /wish-del.', flags: 64 },
  );
});

test('oleksii can list wishes with ids and delete by id', async () => {
  const WISHES = createKv();
  await handleWishCommand(
    interaction('friend', 'wish', [{ name: 'text', value: 'З днем народження!' }]),
    { WISHES },
    {
      now: new Date('2026-07-01T09:00:00.000Z'),
      randomUUID: () => 'wish-1',
    },
  );

  const listResult = await handleWishListIdsCommand(
    interaction('oleksii.usatov', 'wish-list-ids'),
    { WISHES },
  );
  assert.deepEqual(listResult, {
    content: '1782896400000-wish-1: Побажання від friend: З днем народження!',
    flags: 64,
  });

  assert.deepEqual(
    await handleWishDelCommand(
      interaction('oleksii.usatov', 'wish-del', [{ name: 'id', value: '1782896400000-wish-1' }]),
      { WISHES },
    ),
    { content: '🗑️ Wish deleted: 1782896400000-wish-1', flags: 64 },
  );
  assert.deepEqual(
    await handleWishListIdsCommand(interaction('oleksii.usatov', 'wish-list-ids'), { WISHES }),
    { content: 'Побажань ще немає.', flags: 64 },
  );
});
