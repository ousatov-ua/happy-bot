export const WISHES_KV_PREFIX = 'wish:';

export const WISH_GIFS = [
  'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  'https://media.giphy.com/media/Im6d35ebkCIiGzonjI/giphy.gif',
  'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif',
  'https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif',
  'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif',
];

const WISH_BLOCKED_USERS = new Set(['gamervacuum']);
const WISH_VIEW_USERS = new Set(['gamervacuum', 'oleksii.usatov']);
const WISH_OWNER_USERS = new Set(['oleksii.usatov']);
const EPHEMERAL_RESPONSE = 64;

function getUsername(interaction) {
  return interaction.member?.user?.username
    ?? interaction.user?.username
    ?? interaction.member?.nick
    ?? 'unknown';
}

function getStringOption(interaction, name) {
  return interaction.data?.options?.find((option) => option.name === name)?.value;
}

function getWishText(interaction) {
  const textOption = getStringOption(interaction, 'text');
  if (typeof textOption === 'string') {
    return textOption.trim();
  }

  return interaction.data?.options
    ?.find((option) => option.type === 3 && typeof option.value === 'string')
    ?.value
    ?.trim();
}

function privateContent(content) {
  return {
    content,
    flags: EPHEMERAL_RESPONSE,
  };
}

function privateResponse(data) {
  return {
    ...data,
    flags: EPHEMERAL_RESPONSE,
  };
}

function assertWishesStore(env) {
  if (!env.WISHES) {
    throw new Error('WISHES KV binding is not configured');
  }
}

function buildWishId(now = Date.now(), randomUUID = () => crypto.randomUUID()) {
  return `${now}-${randomUUID()}`;
}

function buildWishKey(id) {
  return `${WISHES_KV_PREFIX}${id}`;
}

function wishFromKeyValue(key, value) {
  const wish = JSON.parse(value);
  return {
    id: key.slice(WISHES_KV_PREFIX.length),
    ...wish,
  };
}

async function listWishes(env) {
  assertWishesStore(env);

  let cursor;
  const wishes = [];
  do {
    const result = await env.WISHES.list({
      cursor,
      prefix: WISHES_KV_PREFIX,
    });
    for (const key of result.keys) {
      const value = await env.WISHES.get(key.name);
      if (value) {
        wishes.push(wishFromKeyValue(key.name, value));
      }
    }
    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);

  return wishes.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function buildWishLine(wish) {
  return `Побажання від ${wish.user}: ${wish.text}`;
}

function buildWishEmbeds(wishes) {
  return wishes.slice(0, 10).map((wish, index) => ({
    description: buildWishLine(wish),
    color: 0xffd166,
    thumbnail: { url: WISH_GIFS[index % WISH_GIFS.length] },
    footer: { text: `wish id: ${wish.id}` },
  }));
}

export async function handleWishCommand(interaction, env, context = {}) {
  assertWishesStore(env);

  const user = getUsername(interaction);
  if (WISH_BLOCKED_USERS.has(user)) {
    return privateContent('⛔ You cannot use /wish.');
  }

  const text = getWishText(interaction);
  if (!text) {
    return privateContent('⚠️ Usage: /wish З днем народження, Олег!');
  }

  const id = buildWishId(context.now?.getTime() ?? Date.now(), context.randomUUID);
  const wish = {
    user,
    text,
    createdAt: (context.now ?? new Date()).toISOString(),
  };

  await env.WISHES.put(buildWishKey(id), JSON.stringify(wish));
  return privateContent(`✅ Побажання збережено. id: ${id}`);
}

export async function handleWishesCommand(interaction, env) {
  const user = getUsername(interaction);
  if (!WISH_VIEW_USERS.has(user)) {
    return privateContent('⛔ You cannot use /wishes.');
  }

  const wishes = await listWishes(env);
  if (wishes.length === 0) {
    return privateContent('Побажань ще немає.');
  }

  return privateResponse({
    content: wishes.length > 10
      ? `Показано 10 з ${wishes.length} побажань.`
      : undefined,
    embeds: buildWishEmbeds(wishes),
  });
}

export async function handleWishListIdsCommand(interaction, env) {
  const user = getUsername(interaction);
  if (!WISH_OWNER_USERS.has(user)) {
    return privateContent('⛔ You cannot use /wish-list-ids.');
  }

  const wishes = await listWishes(env);
  if (wishes.length === 0) {
    return privateContent('Побажань ще немає.');
  }

  return privateContent(
    wishes
      .map((wish) => `${wish.id}: ${buildWishLine(wish)}`)
      .join('\n'),
  );
}

export async function handleWishDelCommand(interaction, env) {
  assertWishesStore(env);

  const user = getUsername(interaction);
  if (!WISH_OWNER_USERS.has(user)) {
    return privateContent('⛔ You cannot use /wish-del.');
  }

  const id = getStringOption(interaction, 'id')?.trim();
  if (!id) {
    return privateContent('⚠️ Usage: /wish-del <id>');
  }

  const key = buildWishKey(id);
  const existing = await env.WISHES.get(key);
  if (!existing) {
    return privateContent(`⚠️ Wish not found: ${id}`);
  }

  await env.WISHES.delete(key);
  return privateContent(`🗑️ Wish deleted: ${id}`);
}
