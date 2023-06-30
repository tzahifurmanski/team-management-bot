import { isBotMessage } from "../utils";
import { handleChannelEvent, handleDirectEvent } from "../../../bot_actions";


const messageCallback = async ({ event, client, logger }: any) => {
  try {
    // Ignore messages that the bot post in the conversation
    if (isBotMessage(event)) {
      // TODO: When there was an invalid BOT_USER_OAUTH_ACCESS_TOKEN, and when you DMing the bot,
      //  this is what fires. Error should be clearer
      console.log("Got a message from bot, ignoring...");
      return;
    }
    // Ignore specific messages types that were changed
    if (
      event.subtype === "message_changed" ||
      event.subtype === "message_deleted"
    ) {
      // console.log("Got a message change event, ignoring...");
      return;
    }
    if (event.channel_type === "channel") {
      await handleChannelEvent(event, client);
    } else if (event.channel_type === "im") {
      await handleDirectEvent(event, client);
    }
  } catch (error) {
    logger.error(error);
  }
};

module.exports = { messageCallback };