import { SlackEventMiddlewareArgs, AllMiddlewareArgs } from "@slack/bolt";
import type { GenericMessageEvent } from "@slack/types";
import { isBotMessage } from "../utils.js";
import {
  handleChannelEvent,
  handleDirectEvent,
  type DirectEvent,
} from "../events.js";
import { logger } from "../../../settings/server_consts.js";

export const messageCallback = async ({
  event,
  client,
}: SlackEventMiddlewareArgs<"message"> & AllMiddlewareArgs) => {
  try {
    // Ignore messages that the bot post in the conversation
    if (isBotMessage(event)) {
      // TODO: When there was an invalid BOT_USER_OAUTH_ACCESS_TOKEN, and when you DMing the bot,
      //  this is what fires. Error should be clearer
      logger.info("Got a message from bot, ignoring...");
      return;
    }
    // Ignore specific messages types that were changed
    if (
      event.subtype === "message_changed" ||
      event.subtype === "message_deleted"
    ) {
      logger.debug("Got a message change event, ignoring...");
      return;
    }
    if (event.channel_type === "channel") {
      await handleChannelEvent(event, client);
    } else if (event.channel_type === "im") {
      // After filtering special subtypes, we can safely treat this as a GenericMessageEvent
      await handleDirectEvent(event as GenericMessageEvent as DirectEvent, client);
    }
  } catch (error) {
    logger.error(error);
  }
};
