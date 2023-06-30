import { handleDirectEvent } from "../../../bot_actions";
import { isBotMessage } from "../utils";

const appMentionCallback = async ({ event, client, logger }: any) => {
  if (isBotMessage(event)) {
    console.log("Got a message from bot, ignoring...");
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

module.exports = { appMentionCallback };
