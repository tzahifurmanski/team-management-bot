const config = require("../config.json");
const { WebClient } = require("@slack/web-api");

const BOT_TEST_CHANNEL = config.UNICORN_BOT_CHANNEL_ID;

const token = config.BOT_USER_OAUTH_ACCESS_TOKEN;
console.log("Token", config.BOT_USER_OAUTH_ACCESS_TOKEN);

const { createEventAdapter } = require("@slack/events-api");
const slackSigningSecret = config.SLACK_SIGNING_SECRET;
export const slackEvents = createEventAdapter(slackSigningSecret);

slackEvents.on("message", (event: any) => {
  // Oops! This throws a TypeError.
  event.notAMethod();
});

// All errors in listeners are caught here. If this weren't caught, the program would terminate.
slackEvents.on("error", (error: any) => {
  console.log(error.name); // TypeError
});

const web = new WebClient(token);

export const sendSlackMessage = async function (text: string) {
  // Post a message to the channel, and await the result.
  // Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
  const result = await web.chat.postMessage({
    text: text,
    channel: BOT_TEST_CHANNEL,
  });

  // The result contains an identifier for the message, `ts`.
  console.log(
    `Successfully send message ${result.ts} in conversation ${BOT_TEST_CHANNEL}`
  );
};

// export const slackEvents = slackEvents;
