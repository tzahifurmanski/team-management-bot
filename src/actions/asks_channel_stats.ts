import { getConversationId } from "../slack";

const { sendSlackMessage, getConversationHistory } = require("../slack");

const config = require("../../config.json");

const TEAM_ASK_CHANNEL_ID = config.TEAM_ASK_CHANNEL_ID;
const TEAM_ASK_CHANNEL_NAME = config.TEAM_ASK_CHANNEL_NAME;
// const BOT_NAME = config.BOT_NAME;
// const BOT_DESCRIPTION = config.BOT_DESCRIPTION;

export const ask_channel_stats_action = async function (event: any) {
  // await sendSlackMessage(`Here are some stats!`, event.thread_ts);

  // TODO: Pass the number of days back to go via the event text
  const d = new Date();
  console.log("Got date bef", d.toUTCString());
  // d.setDate(d.getDate() - 5);
  d.setUTCHours(0);
  d.setUTCMinutes(0);
  d.setUTCSeconds(0);
  d.setUTCMilliseconds(0);
  console.log("Got date aft", d.toUTCString());

  // const channel_id = await getConversationId(TEAM_ASK_CHANNEL_NAME);
  const messages = await getConversationHistory(
    TEAM_ASK_CHANNEL_ID,
    d.getTime() / 1000
  );

  // Count the number of messages that were handled
  const checked = messages.filter(function (el: any) {
    return (
      el.reactions &&
      el.reactions.filter(function (reaction: any) {
        return (
          reaction.name === "white_check_mark" ||
          reaction.name === "heavy_check_mark"
        );
      }).length > 0
    );
  }).length;

  // TODO: Add 'These issues are still open (with links)

  // Look at reactions property of a message
  await sendSlackMessage(
    `#${TEAM_ASK_CHANNEL_NAME} had a total of ${
      messages.length
    } messages since ${d.toUTCString()}.\nOut of those, ${checked} were handled.`,
    event.thread_ts
  );
};
