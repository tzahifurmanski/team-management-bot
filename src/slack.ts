import { handle_event } from "./bot_actions";
import {
  ChatGetPermalinkArguments,
  ChatPostMessageArguments,
  ConversationsHistoryArguments,
  ConversationsListArguments,
} from "@slack/web-api";

import { KnownBlock, Block, SectionBlock } from "@slack/types";

const config = require("../config.json");
const { WebClient } = require("@slack/web-api");

const BOT_SLACK_ID = config.BOT_SLACK_ID || "asdas";
const SLACK_USER_FORMAT = /<@.*>/;

export const BOT_LOGGING_CHANNEL_ID = config.BOT_LOGGING_CHANNEL_ID;

const token = config.BOT_USER_OAUTH_ACCESS_TOKEN;

const { createEventAdapter } = require("@slack/events-api");
const slackSigningSecret = config.SLACK_SIGNING_SECRET;
const slackEventsSetup = createEventAdapter(slackSigningSecret);

slackEventsSetup.on("message", async (event: any) => {
  // Ignoring the messages that the bot post in the conversation
  if (event.user === BOT_SLACK_ID) {
    console.log("Message from bot, ignoring...");
    return;
  }

  console.log("GOT A MESSAGE!");
  await handle_event(event);
});

slackEventsSetup.on("app_mention", async (event: any) => {
  console.log("GOT AN APP MENTION!");
  await handle_event(event);
});

// All errors in listeners are caught here. If this weren't caught, the program would terminate.
slackEventsSetup.on("error", (error: any) => {
  // TODO: Add better error handling
  console.log(error.name); // TypeError
});

export const slackEvents = slackEventsSetup;

const web = new WebClient(token);

// Post a message to the channel, and await the result.
// Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
export const sendSlackMessage = async function (
  text: string,
  channel: string,
  thread_ts: string = "",
  blocks: (KnownBlock | Block)[] = []
) {
  const options: ChatPostMessageArguments = {
    text: text,
    channel: channel,
  };

  // If there are blocks, add them
  if (blocks) {
    options["blocks"] = blocks;
  }

  // If we're in a thread, reply in the thread
  if (thread_ts) {
    options["thread_ts"] = thread_ts;
  }
  const result = await web.chat.postMessage(options);

  // The result contains an identifier for the message, `ts`.
  console.log(
    `Successfully send message ${result.ts} in conversation ${channel}`
  );
};

export const createBlock = function (text: string) {
  // TODO: This currently only supports SectionBlock. Make it more dynamic?
  const result: any = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: text,
    },
  };

  return result;
};

export const getUserIDInText = function (text: string) {
  // Remove the bot id and look for other slack users
  // TODO: This currently has a 'bug' where we can grab multiple users and compliment multiple users in one go
  //       it can create a corrupted output for 'compliment @Yossi and also say hi to @Zigi
  const slack_users = text
    .replace(`<@${BOT_SLACK_ID}>`, "")
    .match(SLACK_USER_FORMAT);

  // TODO: This will return the first user_id that is not the bot. If there's more than 1 user, we'll return the first one
  // TODO: Verify that this is an actual user

  // TODO: Make this pretty
  if (!slack_users) {
    return "";
  }

  return slack_users[0];
};

// This is a util function that is able to look for the ID of a conversation / channel by name
export const getConversationId = async function (
  name: string,
  types_list: string = "public_channel",
  cursor: string = ""
): Promise<string> {
  // Get the channels list from slack
  const options: ConversationsListArguments = {
    types: types_list,
    cursor: cursor,
    exclude_archived: true,
  };
  if (cursor) {
    options["cursor"] = cursor;
  }
  const channelsList = await web.conversations.list(options);

  // Look for the channel details in the results
  const filtered = channelsList.channels.filter(function (el: any) {
    return el.name === name;
  });

  // If we've found it, return the ID.
  if (filtered.length > 0) {
    // TODO: If there's more than 1, we'll return the first
    return filtered[0].id;
  } else {
    //  If possible, get the next cursor and look again
    if (!channelsList.response_metadata.next_cursor) {
      // No more data, we didn't find return empty
      return "";
    } else {
      return getConversationId(
        name,
        types_list,
        channelsList.response_metadata.next_cursor
      );
    }
  }
};

export const getMessagePermalink = async function (
  channel_id: string,
  message_ts: string
): Promise<string> {
  const options: ChatGetPermalinkArguments = {
    channel: channel_id,
    message_ts: message_ts,
  };

  const response = await web.chat.getPermalink(options);
  if (response.ok) {
    return response.permalink;
  } else {
    console.log("getMessagePermalink got bad response", response);
    return "";
  }
};

export const getConversationHistory = async function (
  channel_id: string,
  oldest: string = "" // Start of time range of messages to include in results (in seconds).
): Promise<any[]> {
  // TODO: Handle a 'channel not found' error / 'not_in_channel' error

  // Get the channels list from slack
  const options: ConversationsHistoryArguments = {
    channel: channel_id,
    oldest: oldest,
    limit: 100,
  };

  const results: any[] = [];

  let response = await web.conversations.history(options);
  response.messages.forEach(function (message: any) {
    // Filter out messages that has a subtype (like 'channel_join') and messages that are commands to the bot
    if (!message.subtype && !message.text.includes(`<@${BOT_SLACK_ID}>`)) {
      results.push(message);
    }
  });

  while (response.has_more) {
    options["cursor"] = response.response_metadata.next_cursor;
    response = await web.conversations.history(options);

    // Add the messages
    // TODO: Remove redundancy / extract the logic
    response.messages.forEach(function (message: any) {
      // Filter out messages that has a subtype (like 'channel_join') and messages that are commands to the bot
      if (!message.subtype && !message.text.includes(`<@${BOT_SLACK_ID}>`)) {
        results.push(message);
      }
    });
  }

  return results;
};
