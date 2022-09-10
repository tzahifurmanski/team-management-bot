// This is a util function that is able to look for the ID of a conversation / channel by name
import { BOT_ID } from "./consts";
import {
  ConversationsHistoryArguments,
  ConversationsHistoryResponse,
  ConversationsListArguments,
} from "@slack/web-api";
import { Message } from "@slack/web-api/dist/response/ConversationsHistoryResponse";
import { isBotMessage } from "./utils";

// If something is not found, we'll have to go over everything
export const getConversationId = async (
  slackClient: any,
  name: string,
  typesList = "public_channel,private_channel",
  cursor = ""
): Promise<string> => {
  // Return fast if there's no name
  if (!name) {
    return "";
  }

  console.log("Resolving conversation id for channel", name);
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
    console.log(
      "Resolved conversation id for channel '" +
        name +
        "' with '" +
        filtered[0].id +
        "'"
    );
    return filtered[0].id;
  } else {
    //  If possible, get the next cursor and look again
    if (!channelsList.response_metadata.next_cursor) {
      // No more data, we didn't find return empty
      console.log(
        "Could not resolve conversation id for channel '" + name + "'"
      );
      return "";
    } else {
      return getConversationId(
        slackClient,
        name,
        typesList,
        channelsList.response_metadata.next_cursor
      );
    }
  }
};

export const getConversationHistory = async (
  slackClient: any,
  channelId: string,
  oldest = "", // Start of time range of messages to include in results (in seconds).
  latest?: string
): Promise<any[]> => {
  // TODO: Handle a 'channel not found' error / 'not_in_channel' error

  // Get the channels list from slack
  const options: ConversationsHistoryArguments = {
    channel: channelId,
    oldest,
    limit: 100,
  };

  if (latest) {
    options.latest = latest;
  }

  const results: any[] = [];

  let response: ConversationsHistoryResponse =
    await slackClient.conversations.history(options);

  do {
    if (response.messages) {
      response.messages.forEach((message: Message) => {
        // Filter out messages from the bot, and all message events with subtypes that are not bot messages
        if (!shouldMessageBeSkipped(message)) {
          // console.log(`Saving ${JSON.stringify(message)} message`);
          results.push(message);
        }
        // else {
        // console.log(`Skipped ${JSON.stringify(message)} message`);
        // }
      });

      options.cursor = response.response_metadata?.next_cursor;
      response = await slackClient.conversations.history(options);
    }
  } while (response.has_more);

  return results;
};

export const shouldMessageBeSkipped = (message: any) => {
  return (
    isBotMessage(message) ||
    // TODO: Put this in a env var
    message.text.includes(`<@${BOT_ID}>`) || // Skip any messages that refer the bot
    (message.subtype && message.subtype !== "bot_message") || // Skip any message that has a subtype, that is not a bot (We filter the bot later)
    // TODO: Extract the 'Snyk Support' to an env var
    ((message.bot_id || message.subtype) &&
      !(message.username && message.username === "Snyk Support")) // Skip all bot_message except for messages from Snyk Support bot
  );
};
export const getBotId = async (slackClient: any) => {
  // This can also return response.user with the bot username
  const response = await slackClient.auth.test();
  return response?.user_id;
};
