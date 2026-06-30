export const HB_TIME_ZONE = 'Europe/Kyiv';

export const HB_TEMPLATES = [
  {
    name: 'Birthday Card',
    title: '🎂 З днем народження, Олежик!',
    description: [
      'Сьогодні день Олежика: більше радості, менше багів, максимум тепла.\n\nНехай рік буде яскравим, легким і дуже твоїм.',
      'Олежик, хай цей день принесе торт, сміх і купу приємних сюрпризів.\n\nЗ днем народження!',
    ],
    images: [
      'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
      'https://media.giphy.com/media/Im6d35ebkCIiGzonjI/giphy.gif',
    ],
  },
  {
    name: 'Achievement Unlocked',
    title: '🏆 Achievement unlocked',
    description: [
      'Олежик став на 1 рік крутішим!\n\nRewards received:\n🎁 +100 радості\n🎂 +1 святковий торт\n🎮 +50 ігрової удачі\n✨ +999 birthday power\n\nЗ днем народження, Олежик!',
      'Level up complete: Олежик отримав новий birthday-рівень!\n\nRewards received:\n🎁 +100 настрою\n🎂 +1 легендарний торт\n🧠 +25 мудрості\n✨ +999 birthday power\n\nЗ днем народження, Олежик!',
    ],
    images: [
      'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif',
      'https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif',
    ],
  },
  {
    name: 'Birthday Loot',
    title: '🎁 Birthday loot drop',
    description: [
      'Олежик відкрив святковий лутбокс:\n\n🟣 Epic cake\n🟡 Legendary luck\n🔵 Rare good mood\n✨ Mythic birthday aura\n\nЗ днем народження!',
      'Birthday chest unlocked:\n\n🎂 Cake x1\n🎉 Радість x100\n🎮 Удача x50\n💛 Теплі побажання x999\n\nОлежик, це твій день!',
    ],
    images: [
      'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif',
    ],
  },
  {
    name: 'Birthday Spell',
    title: '✨ Birthday spell cast',
    description: [
      'Закляття активовано:\n\n«Нехай Олежик має здоровʼя, радість, удачу і торт без кулдауну».\n\nЕфект триває весь рік.',
      'Магія дня народження спрацювала.\n\n+100 до настрою\n+100 до сил\n+100 до щасливих випадковостей\n\nОлежик, з днем народження!',
    ],
    images: [
      'https://media.giphy.com/media/xTiTnEHBh7qapyuvwQ/giphy.gif',
    ],
  },
  {
    name: 'Birthday Mission',
    title: '🎯 Birthday mission',
    description: [
      'Mission objective:\n1. Прийняти привітання\n2. Зʼїсти щось смачне\n3. Насолодитись днем\n4. Стати ще крутішим\n\nStatus: already in progress, Олежик.',
      'Special quest unlocked for Олежик:\n\nMain quest: святкувати.\nSide quest: посміхатись.\nBonus objective: отримати торт.\n\nReward: легендарний рік попереду.',
    ],
    images: [
      'https://media.giphy.com/media/3o6ZsUJ44ffpnAW7Dy/giphy.gif',
    ],
  },
  {
    name: 'Birthday Fortune',
    title: '🔮 Birthday fortune',
    description: [
      'Пророцтво каже: Олежика чекає рік з хорошими людьми, вдалими моментами і дуже сильним birthday power.\n\nЗ днем народження!',
      'Куля передбачень показує:\n\n🎂 торт поруч\n🎁 сюрпризи близько\n✨ удача активна\n💛 радість стабільна\n\nОлежик, хай так і буде!',
    ],
    images: [
      'https://media.giphy.com/media/l1J9EdzfOSgfyueLm/giphy.gif',
    ],
  },
];

const HB_COLORS = [
  0xff6b6b,
  0xffd166,
  0x06d6a0,
  0x4dabf7,
  0xb197fc,
  0xf783ac,
];

function chooseRandom(items, random = Math.random) {
  return items[Math.floor(random() * items.length)];
}

export function isJulyFirst(date = new Date(), timeZone = HB_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return month === '07' && day === '01';
}

export function buildHbEmbed(random = Math.random) {
  const template = chooseRandom(HB_TEMPLATES, random);
  const description = chooseRandom(template.description, random);
  const color = chooseRandom(HB_COLORS, random);
  const image = chooseRandom([undefined, ...template.images], random);

  const embed = {
    title: template.title,
    description,
    color,
    footer: { text: 'Birthday bot magic ✨' },
  };

  if (image) {
    embed.image = { url: image };
  }

  return embed;
}

export async function handleHbCommand(interaction, env, context = {}) {
  const now = context.now ?? new Date();
  const timeZone = context.timeZone ?? env.HB_TIME_ZONE ?? HB_TIME_ZONE;
  if (!isJulyFirst(now, timeZone)) {
    return '✨ Magic is coming. Check back on July 1.';
  }

  return {
    embeds: [buildHbEmbed(context.random ?? Math.random)],
  };
}
