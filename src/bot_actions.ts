import { what_can_you_do_action } from "./actions/what_can_you_do";
const config = require("../../../config.json");
const { sendSlackMessage } = require("./integrations/slack/messages");
import { compliment_action } from "./actions/compliment";
import { introduce_yourself_action } from "./actions/introduce_yourself";
import { ask_channel_stats_action } from "./actions/ask_channel_stats";
import { review_request_action } from "./actions/review_request";
import { genuine_compliment_action } from "./actions/genuine_compliment";
import { bug_action } from "./actions/bug";

// TODO: Convert to new format: https://api.slack.com/changelog/2020-09-15-events-api-truncate-authed-users

// This method handles events that are posted directly inside a channel
export const handle_channel_event = async function (event: any) {
  // TODO: Limit this functionality to specific channels?
  if (event.channel == config.TEAM_ASK_CHANNEL_ID) {
    console.log(
      "This is the asks channel, we don't want to respond just yet..."
    );
    return;
  }

  console.log("Got new event", event);

  if (event.text.toLowerCase().startsWith("folks")) {
    await sendSlackMessage(
      "https://media.giphy.com/media/C5eDFesCSregw/giphy.gif",
      event.channel,
      event.thread_ts
    );
    return;
  }

  // When someone asks for a review
  if (
    event.text.toLowerCase().startsWith("can i") ||
    event.text.toLowerCase().includes("please") ||
    event.text.toLowerCase().includes("help") ||
    event.text.toLowerCase().includes("review")
  ) {
    await review_request_action(event);
    return;
  }

  // When someone reports on a bug
  if (
    event.text.toLowerCase().includes("bug") ||
    event.text.toLowerCase().includes("issue")
  ) {
    await bug_action(event);
    return;
  }

  console.log("Unsupported event", event);
};

// This method handles events that are with direct interaction with the bot (like a DM or when the bot is tagged)
export const handle_direct_event = async function (event: any) {
  console.log("Got new event", event);

  if (event.text.includes("introduce yourself")) {
    await introduce_yourself_action(event);
    return;
  }

  if (event.text.includes("what can you do")) {
    await what_can_you_do_action(event);
    return;
  }

  if (event.text.includes("meaning of life")) {
    await sendSlackMessage(`42`, event.channel, event.thread_ts);
    return;
  }

  //
  if (
    event.text.includes("compliment") ||
    event.text.includes("say something nice")
  ) {
    await compliment_action(event);
    return;
  }

  if (event.text.includes("genuine compliment") || event.text.includes("hug")) {
    await genuine_compliment_action(event);
    return;
  }

  if (event.text.includes("ask channel stats")) {
    await ask_channel_stats_action(event);
    return;
  }

  console.log("Unsupported event", event);
};
