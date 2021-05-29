// This is a util function that is able to look for the ID of a conversation / channel by name
import { BOT_ID, SlackWebClient } from './consts';
import { ConversationsHistoryArguments, ConversationsListArguments } from '@slack/web-api';
import { isBotMessage } from './events';

// If something is not found, we'll have to go over everything
export const getConversationId = async function(
  name: string,
  types_list: string = 'public_channel,private_channel',
  cursor: string = '',
): Promise<string> {
  console.log('Resolving conversation id for channel', name);
  // Get the channels list from slack
  const options: ConversationsListArguments = {
    types: types_list,
    cursor: cursor,
    exclude_archived: true,
  };
  if (cursor) {
    options["cursor"] = cursor;
  }
  const channelsList = await SlackWebClient.conversations.list(options);

  // Look for the channel details in the results
  const filtered = channelsList.channels.filter(function (el: any) {
    return el.name === name;
  });

  // If we've found it, return the ID.
  if (filtered.length > 0) {
    // TODO: If there's more than 1, we'll return the first
    console.log(
      'Resolving conversation id for channel \'' +
      name +
      '\' with \'' +
      filtered[0].id +
      '\'',
    );
    return filtered[0].id;
  } else {
    //  If possible, get the next cursor and look again
    if (!channelsList.response_metadata.next_cursor) {
      // No more data, we didn't find return empty
      console.log(
        'Could not resolve conversation id for channel \'' + name + '\'',
      );
      return '';
    } else {
      return getConversationId(
        name,
        types_list,
        channelsList.response_metadata.next_cursor
      );
    }
  }
};

export const getConversationHistory = async function (
  channel_id: string,
  oldest: string = "", // Start of time range of messages to include in results (in seconds).
  latest?: string
): Promise<any[]> {
  // TODO: Handle a 'channel not found' error / 'not_in_channel' error

  // Get the channels list from slack
  const options: ConversationsHistoryArguments = {
    channel: channel_id,
    oldest: oldest,
    limit: 100,
  };

  if (latest) {
    options.latest = latest;
  }

  const results: any[] = [];

  let response = await SlackWebClient.conversations.history(options);
  response.messages.forEach(function (message: any) {
    // Filter out messages from the bot, and all message events with subtypes that are not bot messages
    if (
      !message.text.includes(`<@${BOT_ID}>`) &&
      !isBotMessage(message) &&
      (!message.subtype || message.subtype == "bot_message")
    ) {
      results.push(message);
    }
  });

  while (response.has_more) {
    options["cursor"] = response.response_metadata.next_cursor;
    response = await SlackWebClient.conversations.history(options);

    // Add the messages
    // TODO: Remove redundancy / extract the logic
    response.messages.forEach(function (message: any) {
      // Filter out messages from the bot, and all message events with subtypes that are not bot messages
      if (
        !message.text.includes(`<@${BOT_ID}>`) &&
        !isBotMessage(message) &&
        (!message.subtype || message.subtype == "bot_message")
      ) {
        results.push(message);
      }
    });
  }

  return results;
};

export const getBotId = async function () {
  // This can also return response.user with the bot user name
  let response = await SlackWebClient.auth.test();
  return response?.user_id;
};
