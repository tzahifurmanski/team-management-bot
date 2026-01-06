import { SlackEventMiddlewareArgs, AllMiddlewareArgs } from "@slack/bolt";
import { handleDirectEvent } from "../events.js";
import { isBotMessage } from "../utils.js";
import { logger } from "../../../settings/server_consts.js";

export const appMentionCallback = async ({
  event,
  client,
}: SlackEventMiddlewareArgs<"app_mention"> & AllMiddlewareArgs) => {
  if (isBotMessage(event)) {
    logger.info("Got a message from bot, ignoring...");
    return;
  }

  try {
    // If this is a thread reply (has thread_ts different from ts), don't reply
    if (event.thread_ts && event.thread_ts !== event.ts) {
      return;
    }
    await handleDirectEvent(event, client);
  } catch (error) {
    logger.error(error);
  }
};
