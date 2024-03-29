import {
  convertSecondsToTimeString,
  countReactions,
  isBotMessage,
} from "../utils";
import {
  ALLOWED_BOTS_PER_TEAM,
  TEAM_ASK_CHANNEL_ID,
} from "../../../settings/team_consts";
import { getUserProfile } from "../users";
import { getConversationHistory } from "../conversations";
import { logger, REACTIONS_HANDLED } from "../../../settings/server_consts";

const reactionAddedCallback = async ({ event, client }: any) => {
  logger.debug("Got a reaction added callback...", JSON.stringify(event));

  try {
    if (!REACTIONS_HANDLED.includes(event.reaction)) {
      logger.trace("Irrelevant reaction, skipping.");
      return;
    }

    // Verify we are in the ask channel
    if (!TEAM_ASK_CHANNEL_ID.includes(event.item.channel)) {
      logger.trace(
        "Reaction is not in an ask channel, skipping.",
        `Message channel: ${event.item.channel}`,
        `Allowed channels: ${JSON.stringify(TEAM_ASK_CHANNEL_ID)}`,
      );
      return;
    }

    // TODO: Maybe unneeded - Could it be that the bot is adding emojis?
    if (isBotMessage(event)) {
      logger.debug("Got a message from bot, skipping.");
      return;
    }

    // Check if the emoji was applied on a message that is skipped
    const messages = await getConversationHistory(
      client,
      event.item.channel,
      ALLOWED_BOTS_PER_TEAM.get(event.item.channel) || [],
      event.item.ts,
      event.item.ts,
      1,
      true,
    );
    if (messages.length == 0) {
      // Cant find original message,
      // probably a message that should be skipped,
      // therefore this should not operate on
      logger.debug("Reaction was added on a skipped message, skipping.");
      return;
    }

    // Check if the reaction is the first one of it's kind
    const originalMessage = messages[0];
    if (countReactions(originalMessage, REACTIONS_HANDLED) > 1) {
      logger.debug("More then 1 COMPLETED emoji, skipping");
      return;
    }

    // Calculate the time from start to resolution
    const duration = convertSecondsToTimeString(event.event_ts - event.item.ts);

    const userProfile = (await getUserProfile(client, event.user)) || {};

    // TODO: Instead, should I tag the closing user?
    const promptText = `${
      event.user ? userProfile?.display_name : event.username
    } has resolved this ask after ${duration}.`;

    await client.chat.postMessage({
      channel: event.item.channel,
      thread_ts: event.item.ts,
      text: promptText,
    });

    logger.debug("Done handling the reaction.", JSON.stringify(event));
  } catch (error) {
    logger.error(error);
  }
};

module.exports = { reactionAddedCallback };
