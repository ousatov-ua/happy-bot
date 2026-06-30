export const YT_SHORT_KEYWORDS = [
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
];

export function selectYtShortKeyword(random = Math.random) {
  const totalWeight = YT_SHORT_KEYWORDS.reduce(
    (sum, keyword) => sum + keyword.weight,
    0,
  );
  let threshold = random() * totalWeight;

  for (const keyword of YT_SHORT_KEYWORDS) {
    threshold -= keyword.weight;
    if (threshold < 0) {
      return keyword.query;
    }
  }

  return YT_SHORT_KEYWORDS.at(-1).query;
}

export function buildYtShortSearchQuery(keyword) {
  return encodeURIComponent(`${keyword} funny clean family friendly #shorts`);
}

function privateYtShortResponse(content) {
  return { content, flags: 64 };
}

export async function handleYtShortCommand(interaction, env) {
  const randomWord = selectYtShortKeyword();
  const searchQuery = buildYtShortSearchQuery(randomWord);

  try {
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&safeSearch=strict&maxResults=15&q=${searchQuery}&key=${env.YOUTUBE_API_KEY}`;

    const ytResponse = await fetch(youtubeUrl);
    const ytData = await ytResponse.json();

    if (!ytData.items || ytData.items.length === 0) {
      return privateYtShortResponse(
        '⚠️ No new shorts found matching the random query. Try again!',
      );
    }

    let chosenVideoId = null;
    for (const item of ytData.items) {
      const videoId = item.id.videoId;
      const hasBeenUsed = await env.USED_VIDEOS.get(videoId);
      if (!hasBeenUsed) {
        chosenVideoId = videoId;
        break;
      }
    }

    if (!chosenVideoId) {
      chosenVideoId = ytData.items[0].id.videoId;
    }

    await env.USED_VIDEOS.put(chosenVideoId, 'true');
    return privateYtShortResponse(
      `🎬 ho-ho:\nhttps://youtube.com/shorts/${chosenVideoId}`,
    );
  } catch (error) {
    console.log(`Exception while handleYtShortCommand: ${error}`);
    return privateYtShortResponse(
      '⚠️ Failed to fetch from YouTube. Please try again later.',
    );
  }
}
