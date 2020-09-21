import { app_mention } from "./bot_actions";

const config = require("../config.json");
const { WebClient } = require("@slack/web-api");

const BOT_SLACK_ID = config.BOT_SLACK_ID || "asdas";
const SLACK_USER_FORMAT = /<@.*>/;

const BOT_TEST_CHANNEL = config.UNICORN_BOT_CHANNEL_ID;

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

  const message_options: { [k: string]: any } = {
    text: text,
    channel: BOT_TEST_CHANNEL,
  };

  // If we're in a thread, comment in the thread
  if (thread_ts) {
    message_options["thread_ts"] = thread_ts;
  }
  const result = await web.chat.postMessage(message_options);

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
