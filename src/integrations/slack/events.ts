import { handle_direct_event, handle_channel_event } from "../../bot_actions";

import { BOT_SLACK_ID } from "./consts";
const config = require("../../../config.json");

const { createEventAdapter } = require("@slack/events-api");
const slackSigningSecret = config.SLACK_SIGNING_SECRET;
const slackEventsSetup = createEventAdapter(slackSigningSecret);

slackEventsSetup.on("app_mention", async (event: any) => {
  console.log("GOT AN APP MENTION!");
  await handle_direct_event(event);
});

slackEventsSetup.on("message", async (event: any) => {
  // Ignore messages that the bot post in the conversation
  if (event.user === BOT_SLACK_ID) {
    console.log("Got a message from bot, ignoring...");
    return;
  }

  // Ignore specific messages types that were changed
  if (
    event.subtype === "message_changed" ||
    event.subtype === "message_deleted"
  ) {
    console.log("Got a message change event, ignoring...");
    return;
  }

  if (event.channel_type == "channel") {
    console.log("GOT A channel event!");
    await handle_channel_event(event);
  } else if (event.channel_type == "im") {
    console.log("GOT A MESSAGE!");
    await handle_direct_event(event);
  }
});

// All errors in listeners are caught here. If this weren't caught, the program would terminate.
slackEventsSetup.on("error", (error: any) => {
  // TODO: Add better error handling
  console.log("Had an error!", error.name); // TypeError
});

export const slackEvents = slackEventsSetup;
