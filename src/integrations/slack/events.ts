import { handle_channel_event, handle_direct_event } from "../../bot_actions";

import { BOT_ID, setSlackConfiguration } from "./consts";
import { getBotId, getConversationId } from "./conversations";
import { botConfig } from "../../bot_config";

const { createEventAdapter } = require("@slack/events-api");
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackEventsSetup = createEventAdapter(slackSigningSecret);

// Resolve the slack dynamic variables
export const loadSlackConfig = async function () {
  console.log("Starting Slack config load...");
  try {
    const botId = await getBotId();

    const teamAskChannelId =
      process.env.TEAM_ASK_CHANNEL_ID ||
      (await getConversationId(process.env.TEAM_ASK_CHANNEL_NAME || ""));

    const teamChatterChannelId =
      process.env.TEAM_CHATTER_CHANNEL_ID ||
      (await getConversationId(process.env.TEAM_CHATTER_CHANNEL_NAME || ""));

    const teamCodeReviewChannelId =
      process.env.TEAM_CODE_REVIEW_CHANNEL_ID ||
      (await getConversationId(
        process.env.TEAM_CODE_REVIEW_CHANNEL_NAME || ""
      ));

    const teamLeadsChannelId =
      process.env.TEAM_LEADS_CHANNEL_ID ||
      (await getConversationId(process.env.TEAM_LEADS_CHANNEL_NAME || ""));

    const botTestsChannelId =
      process.env.BOT_TESTS_CHANNEL_ID ||
      (await getConversationId(process.env.BOT_TESTS_CHANNEL_NAME || ""));

    // TODO: Allow to add defaults
    let groupAsksChannelsList = new Map<string, string>();

    const asksChannels = (process.env.GROUP_ASK_CHANNELS || "").split(",");
    asksChannels.forEach((channelDetails: string) => {
      const details = channelDetails.split(":");
      groupAsksChannelsList.set(details[0], details[1]);
    });

    groupAsksChannelsList.set(
      process.env.TEAM_ASK_CHANNEL_NAME || "",
      teamAskChannelId
    );

    setSlackConfiguration(
      botId,
      teamAskChannelId,
      teamChatterChannelId,
      teamCodeReviewChannelId,
      teamLeadsChannelId,
      botTestsChannelId,
      groupAsksChannelsList
    );

    console.log("Slack config completed successfully.");
  } catch (err) {
    console.log("Error while loading Slack Dynamic vars!", err);
    return false;
  }

  return true;
};

slackEventsSetup.on("app_mention", async (event: any) => {
  // console.log("GOT AN APP MENTION!");
  await handle_direct_event(event);
});

slackEventsSetup.on("message", async (event: any) => {
  // Ignore messages that the bot post in the conversation
  if (isBotMessage(event)) {
    console.log("Got a message from bot, ignoring...");
    return;
  }

  // Ignore specific messages types that were changed
  if (
    event.subtype === "message_changed" ||
    event.subtype === "message_deleted"
  ) {
    // console.log("Got a message change event, ignoring...");
    return;
  }

  if (event.channel_type == "channel") {
    // console.log("GOT A channel event!");
    await handle_channel_event(event);
  } else if (event.channel_type == "im") {
    // console.log("GOT A MESSAGE!");
    await handle_direct_event(event);
  }
});

// All errors in listeners are caught here. If this weren't caught, the program would terminate.
slackEventsSetup.on("error", (error: any) => {
  // TODO: Add better error handling
  console.log("Had an error!", error.name); // TypeError
});

export const isBotMessage = function (event: any): boolean {
  return (
    event.user === BOT_ID ||
    event.username === botConfig.BOT_NAME ||
    event.message?.username === botConfig.BOT_NAME
  );
};
export const slackEvents = slackEventsSetup;
