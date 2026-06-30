import { handleHbCommand } from './hb.js';
import { handlePingCommand } from './ping.js';
import {
  handleWishCommand,
  handleWishDelCommand,
  handleWishListIdsCommand,
  handleWishesCommand,
} from './wish.js';
import { handleYtShortCommand } from './ytshort.js';

export const COMMAND_ROUTER = {
  ytshort: handleYtShortCommand,
  ping: handlePingCommand,
  hb: handleHbCommand,
  wish: handleWishCommand,
  wishes: handleWishesCommand,
  'wish-list-ids': handleWishListIdsCommand,
  'wish-del': handleWishDelCommand,
};

export async function handleSlashCommand(interaction, env) {
  const commandName = interaction.data?.name;
  const handler = COMMAND_ROUTER[commandName];
  if (!handler) {
    return undefined;
  }

  return handler(interaction, env);
}
