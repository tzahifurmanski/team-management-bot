import { app_mention } from "./bot_actions";

const config = require("../config.json");
const { WebClient } = require("@slack/web-api");

const BOT_SLACK_ID = config.BOT_SLACK_ID || "asdas";
const SLACK_USER_FORMAT = /<@.*>/;

const BOT_TEST_CHANNEL = config.BOT_LOGGING_CHANNEL_ID;

const token = config.BOT_USER_OAUTH_ACCESS_TOKEN;
console.log("Token", config.BOT_USER_OAUTH_ACCESS_TOKEN);

const { createEventAdapter } = require("@slack/events-api");
const slackSigningSecret = config.SLACK_SIGNING_SECRET;
const slackEventsSetup = createEventAdapter(slackSigningSecret);

slackEventsSetup.on("message", (event: any) => {
  // TODO: Implement this
  console.log("GOT A MESSAGE!");
  console.log(event);
});

slackEventsSetup.on("app_mention", async (event: any) => {
  console.log("GOT AN APP MENTION!");
  console.log(event);
  await app_mention(event);
});

// All errors in listeners are caught here. If this weren't caught, the program would terminate.
slackEventsSetup.on("error", (error: any) => {
  // TODO: Add better error handling
  console.log(error.name); // TypeError
});

export const slackEvents = slackEventsSetup;

const web = new WebClient(token);

export const sendSlackMessage = async function (
  text: string,
  thread_ts: string = ""
) {
  // Post a message to the channel, and await the result.
  // Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage

  // TODO: Identify if the message I'm responding to is in thread and if so, reply in thread
  // thread_ts

  // var obj: {[k: string]: any} = {};

  const options: { [k: string]: any } = {
    text: text,
    channel: BOT_TEST_CHANNEL,
  };

  // If we're in a thread, comment in the thread
  if (thread_ts) {
    options["thread_ts"] = thread_ts;
  }
  const result = await web.chat.postMessage(options);

  // The result contains an identifier for the message, `ts`.
  console.log(
    `Successfully send message ${result.ts} in conversation ${BOT_TEST_CHANNEL}`
  );
};

export const getUserIDInText = function (text: string) {
  // Remove the bot id and look for other slack users
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
  const options: { [k: string]: any } = {
    types: types_list,
    cursor: cursor,
    exclude_archived: true,
    // limit: 1000 // TODO: Not sure I need it
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
    // console.log(filtered);
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

export const getConversationHistory = async function (
  channel_id: string,
  // latest: string = "now", // End of time range of messages to include in results.
  oldest: string = "" // Start of time range of messages to include in results (in seconds).
  // inclusive: boolean = true, // Include messages with latest or oldest timestamp in results only when either timestamp is specified.
  // cursor: string = ""
): Promise<any[]> {
  // TODO: Handle a 'channel not found' error / 'not_in_channel' error

  // Get the channels list from slack
  const options: { [k: string]: any } = {
    // cursor: cursor,
    channel: channel_id,
    oldest: oldest, // Convert ms to seconds
    // oldest: "1600630749.827",
    limit: 100,
  };

  const results: any[] = [];

  let response = await web.conversations.history(options);
  response.messages.forEach(function (message: any) {
    // Filter out messages that has a subtype (like 'channel_join')
    if (!message.subtype) {
      results.push(message);
    }
  });

  while (response.has_more) {
    options["cursor"] = response.response_metadata.next_cursor;
    response = await web.conversations.history(options);

    // Add the messages
    response.messages.forEach(function (message: any) {
      // Filter out messages that has a subtype (like 'channel_join')
      if (!message.subtype) {
        results.push(message);
      }
    });
  }

  return results;
};
