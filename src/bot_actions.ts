import { what_can_you_do_action } from "./actions/what_can_you_do";

const { sendSlackMessage, BOT_LOGGING_CHANNEL_ID } = require("./slack");
import { compliment_action } from "./actions/compliment";
import { introduce_yourself_action } from "./actions/introduce_yourself";
import { ask_channel_stats_action } from "./actions/ask_channel_stats";

const config = require("../config.json");

const BOT_NAME = config.BOT_NAME;

export const post_init = async function () {
  await sendSlackMessage(
    `${BOT_NAME} is initialising!`,
    BOT_LOGGING_CHANNEL_ID
  );
};

export const post_shutdown = async function () {
  await sendSlackMessage(`${BOT_NAME} is going down!`, BOT_LOGGING_CHANNEL_ID);
};

export const handle_event = async function (event: any) {
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

  if (
    event.text.includes("compliment") ||
    event.text.includes("say something nice")
  ) {
    await compliment_action(event);
    return;
  }

  if (event.text.includes("ask channel stats")) {
    await ask_channel_stats_action(event);
    return;
  }

  console.log("Unsupported event", event);
};
