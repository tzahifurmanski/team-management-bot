import { handleDirectEvent } from "../events.js";
import { isBotMessage } from "../utils.js";
import { logger } from "../../../settings/server_consts.js";

export const appMentionCallback = async ({ event, client }: any) => {
  if (isBotMessage(event)) {
    logger.info("Got a message from bot, ignoring...");
    return;
  }

  try {
    // If this is an edit to an existing mention, don't reply anything
    if (event.reply_count) {
      return;
    }
    await handleDirectEvent(event, client);
  } catch (error) {
    logger.error(error);
  }
};
