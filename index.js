// ==========================================
// 1. BOT COMMAND DEFINITIONS
// ==========================================

async function handleYtShort(interaction, env) {
const keywords = [
  // 1. High-Concept & Situational Irony (Clever skits)
  "pov explaining to someone from the past clean",
  "corporate satire clean skit",
  "time traveler dynamic comedy",
  "tech support parody dry wit",

  // 2. Deadpan & Observational (Calm, structured delivery)
  "deadpan observational comedy clean",
  "dry wit sketch comedy clean",
  "clean stand up comedy dry humor",
  "subtle situational irony compilation",

  // 3. Clever Text/Visual Wordplay
  "intelligent wordplay compilation",
  "clever literal humor clean",
  "classical art memes text funny",
  "history memes clean witty"
];

  const randomWord = keywords[Math.floor(Math.random() * keywords.length)];
  const searchQuery = encodeURIComponent(`${randomWord} #shorts`);
  
  try {
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&safeSearch=strict&maxResults=15&q=${searchQuery}&key=${env.YOUTUBE_API_KEY}`;
    
    const ytResponse = await fetch(youtubeUrl);
    const ytData = await ytResponse.json();
    
    if (!ytData.items || ytData.items.length === 0) {
      return "⚠️ No new shorts found matching the random query. Try again!";
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

    await env.USED_VIDEOS.put(chosenVideoId, "true");
    return `🎬 ho-ho:\nhttps://youtube.com/shorts/${chosenVideoId}`;

  } catch (error) {
    return "⚠️ Failed to fetch from YouTube. Please try again later.";
  }
}

async function handlePingCommand(interaction, env) {
  return "🏓 Pong! The backend is alive and responding instantly.";
}

// To add a new command: Define its function above, then map it here!
const COMMAND_ROUTER = {
  "ytshort": handleYtShort,
  "ping": handlePingCommand,
};

// ==========================================
// 2. CORE SECURITY HANDSHAKE (Ed25519)
// ==========================================

async function verifyDiscordSignature(request, publicKeyHex) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.clone().text();

  if (!signature || !timestamp || !publicKeyHex) return false;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(publicKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))),
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['verify']
    );

    return await crypto.subtle.verify(
      'Ed25519',
      key,
      new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16))),
      new TextEncoder().encode(timestamp + body)
    );
  } catch (err) {
    return false;
  }
}

// ==========================================
// 3. MAIN GLOBAL ENTRY POINT
// ==========================================

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const isVerified = await verifyDiscordSignature(request, env.DISCORD_PUBLIC_KEY);
    if (!isVerified) {
      return new Response('Invalid request signature', { status: 401 });
    }

    const interaction = await request.json();

    // Discord Ping Handshake
    if (interaction.type === 1) {
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Slash Command Handler
    if (interaction.type === 2) {
      const commandName = interaction.data.name;

      if (commandName in COMMAND_ROUTER) {
        const responseContent = await COMMAND_ROUTER[commandName](interaction, env);
        return new Response(
          JSON.stringify({
            type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
            data: { content: responseContent },
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response('Unknown Interaction', { status: 400 });
  },
};
