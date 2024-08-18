import {
  convertSecondsToTimeString,
  countReactions,
  isBotMessage,
} from "../utils";
import { getUserProfile } from "../users";
import { getConversationHistory } from "../conversations";
import { logger, REACTIONS_HANDLED } from "../../../settings/server_consts";
import { findTeamByValue } from "../../../settings/team_utils";

const reactionAddedCallback = async ({ event, client }: any) => {
  logger.debug("Got a reaction added callback...", JSON.stringify(event));

  try {
    if (!REACTIONS_HANDLED.includes(event.reaction)) {
      logger.trace("Irrelevant reaction, skipping.");
      return;
    }

    const team = findTeamByValue(event.item.channel, "ask_channel_id");
    if (!team) {
      logger.error(
        `Unable to find team for channel ID ${event.item.channel}. Ask: ${event.text}`,
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
      team.ask_channel_id,
      team.allowed_bots || [],
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
      channel: team.ask_channel_id,
      thread_ts: event.item.ts,
      text: promptText,
    });

    logger.debug("Done handling the reaction.", JSON.stringify(event));
  } catch (error) {
    logger.error(error);
  }
};

module.exports = { reactionAddedCallback };
