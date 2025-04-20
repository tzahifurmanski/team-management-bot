import {
  ConversationsHistoryArguments,
  ConversationsHistoryResponse,
  ConversationsListArguments,
} from "@slack/web-api";
import { isBotMessage } from "./utils.js";
import { logger, BOT_SLACK_ID } from "../../settings/server_consts.js";

// This is a util function that is able to look for the ID of a conversation / channel by name
export const getConversationId = async (
  slackClient: any,
  name: string,
  typesList = "public_channel,private_channel",
  cursor = "",
): Promise<string> => {
  // Return fast if there's no name
  if (!name) {
    return "";
  }

  logger.info("Resolving conversation id for channel", name);
  // Get the channels list from slack
  const options: ConversationsListArguments = {
    types: typesList,
    cursor,
    exclude_archived: true,
  };
  if (cursor) {
    options.cursor = cursor;
  }
  const channelsList = await slackClient.conversations.list(options);

  // Look for the channel details in the results
  const filtered = channelsList.channels.filter((el: any) => {
    return el.name === name;
  });

  // If we've found it, return the ID.
  if (filtered.length > 0) {
    // TODO: If there's more than 1, we'll return the first
    logger.info(
      "Resolved conversation id for channel '" +
        name +
        "' with '" +
        filtered[0].id +
        "'",
    );
    return filtered[0].id;
  } else {
    //  If possible, get the next cursor and look again
    if (!channelsList.response_metadata.next_cursor) {
      // No more data, we didn't find return empty
      logger.warning(
        "Could not resolve conversation id for channel '" + name + "'",
      );
      return "";
    } else {
      return getConversationId(
        slackClient,
        name,
        typesList,
        channelsList.response_metadata.next_cursor,
      );
    }
  }
};

export const getConversationHistory = async (
  slackClient: any,
  channelId: string,
  allowed_bots: string[],
  oldest?: string, // Start of time range of messages to include in results (in seconds).
  latest?: string,
  limit?: number,
  inclusive?: boolean,
): Promise<any[]> => {
  logger.trace("Entering getConversationHistory");

  // TODO: Handle a 'channel not found' error / 'not_in_channel' error

  // Get the channels list from slack
  const options: ConversationsHistoryArguments = {
    channel: channelId,
    limit: limit || 100,
  };

  if (oldest) {
    options.oldest = oldest;
  }

  if (latest) {
    options.latest = latest;
  }

  if (inclusive) {
    options.inclusive = inclusive;
  }

  const results: any[] = [];

  logger.trace("FIRING using options", JSON.stringify(options));

  let response: ConversationsHistoryResponse =
    await slackClient.conversations.history(options);

  do {
    logger.debug("ITERATING RESULTS");
    if (response.messages) {
      response.messages.forEach((message) => {
        // Filter out messages from the bot, and all message events with subtypes that are not bot messages
        // TODO: Extract this
        if (!shouldMessageBeSkipped(message, allowed_bots)) {
          logger.trace(`Saving ${JSON.stringify(message)} message`);
          results.push(message);
        } else {
          logger.trace(`Skipped ${JSON.stringify(message)} message`);
        }
      });

      options.cursor = response.response_metadata?.next_cursor;
      response = await slackClient.conversations.history(options);
    }
  } while (response.has_more);

  return results;
};

export const shouldMessageBeSkipped = (
  message: any,
  allowed_bots: string[],
) => {
  return (
    isBotMessage(message) ||
    // TODO: Put this in a env var
    message.text.includes(`<@${BOT_SLACK_ID}>`) || // Skip any messages that refer the bot
    (message.subtype && message.subtype !== "bot_message") || // Skip any message that has a subtype, that is not a bot (We filter the bot later)
    ((message.bot_id || message.subtype) &&
      !isBotAllowed(message, allowed_bots))
  );
};
export const getBotId = async (slackClient: any) => {
  // This can also return response.user with the bot username
  const response = await slackClient.auth.test();
  return response?.user_id;
};

// Skip all bot_message except for messages from allowed bots
export const isBotAllowed = (
  message: any,
  allowedBotsList: string[],
): boolean => {
  return (
    (message.username && allowedBotsList.includes(message.username)) ||
    (message.bot_profile && allowedBotsList.includes(message.bot_profile.name))
  );
};
