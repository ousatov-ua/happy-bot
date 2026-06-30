import { handleSlashCommand } from './commands/index.js';
import { discordCommandResponse, verifyDiscordSignature } from './discord.js';

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

    if (interaction.type === 1) {
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (interaction.type === 2) {
      const commandResult = await handleSlashCommand(interaction, env);
      if (commandResult !== undefined) {
        return discordCommandResponse(commandResult);
      }
    }

    return new Response('Unknown Interaction', { status: 400 });
  },
};
