import { handleHbCommand } from './hb.js';
import { handlePingCommand } from './ping.js';
import { handleYtShortCommand } from './ytshort.js';

export const COMMAND_ROUTER = {
  ytshort: handleYtShortCommand,
  ping: handlePingCommand,
  hb: handleHbCommand,
};

export async function handleSlashCommand(interaction, env) {
  const commandName = interaction.data?.name;
  const handler = COMMAND_ROUTER[commandName];
  if (!handler) {
    return undefined;
  }

  return handler(interaction, env);
}
