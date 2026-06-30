const YT_SHORT_KEYWORDS = [
  // 1. High-Concept & Situational Irony (Clever skits)
  'pov explaining to someone from the past clean',
  'corporate satire clean skit',
  'time traveler dynamic comedy',
  'tech support parody dry wit',

  // 2. Deadpan & Observational (Calm, structured delivery)
  'deadpan observational comedy clean',
  'dry wit sketch comedy clean',
  'clean stand up comedy dry humor',
  'subtle situational irony compilation',

  // 3. Clever Text/Visual Wordplay
  'intelligent wordplay compilation',
  'clever literal humor clean',
  'classical art memes text funny',
  'history memes clean witty',
];

export async function handleYtShortCommand(interaction, env) {
  const randomWord = YT_SHORT_KEYWORDS[
    Math.floor(Math.random() * YT_SHORT_KEYWORDS.length)
  ];
  const searchQuery = encodeURIComponent(`${randomWord} #shorts`);

  try {
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&safeSearch=strict&maxResults=15&q=${searchQuery}&key=${env.YOUTUBE_API_KEY}`;

    const ytResponse = await fetch(youtubeUrl);
    const ytData = await ytResponse.json();

    if (!ytData.items || ytData.items.length === 0) {
      return '⚠️ No new shorts found matching the random query. Try again!';
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
    return `🎬 ho-ho:\nhttps://youtube.com/shorts/${chosenVideoId}`;
  } catch (error) {
    console.log(`Exception while handleYtShortCommand: ${error}`);
    return '⚠️ Failed to fetch from YouTube. Please try again later.';
  }
}
