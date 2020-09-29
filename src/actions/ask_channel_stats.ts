import {
  createBlock,
  getMessagePermalink,
} from "../integrations/slack/messages";
import { getConversationHistory } from "../integrations/slack/conversations";

const { sendSlackMessage } = require("../integrations/slack/messages");

const config = require("../../config.json");

// TODO: Resolve this on bot initialization
const TEAM_ASK_CHANNEL_ID = config.TEAM_ASK_CHANNEL_ID;

// TODO Make this prettier
function toDateTime(secs: any): Date {
  var t = new Date(1970, 0, 1); // Epoch
  t.setSeconds(secs);
  return t;
}

export const ask_channel_stats_action = async function (event: any) {
  // TODO: Pass the number of days back to go via the event text. Right now taking a week back
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setUTCHours(0);
  d.setUTCMinutes(0);
  d.setUTCSeconds(0);
  d.setUTCMilliseconds(0);

  // const channel_id = await getConversationId(TEAM_ASK_CHANNEL_NAME);
  console.log(d.getTime() / 1000);
  const messages = await getConversationHistory(
    TEAM_ASK_CHANNEL_ID,
    (d.getTime() / 1000).toString()
  );

  // Go over all unchecked messages and get the permalinks
  const unchecked_messages = messages.filter(function (el: any) {
    return (
      !el.reactions ||
      el.reactions.filter(function (reaction: any) {
        return (
          reaction.name === "white_check_mark" ||
          reaction.name === "heavy_check_mark" ||
          reaction.name === "in-progress"
        );
      }).length == 0
    );
  });

  const unchecked_blocks: string[] = [];

  await Promise.all(
    unchecked_messages.map(async (message: any) => {
      let permalink = await getMessagePermalink(
        TEAM_ASK_CHANNEL_ID,
        message.ts
      );
      if (permalink) {
        unchecked_blocks.push(
          createBlock(
            `<${permalink}|Link to message> from <@${
              message.user
            }> at ${toDateTime(message.ts).toLocaleDateString()}`
          )
        );
      }
    })
  );

  // Go over all unchecked messages and get the permalinks
  const in_progress_messages = messages.filter(function (el: any) {
    return (
      el?.reactions?.filter(function (reaction: any) {
        return reaction.name === "in-progress";
      }).length > 0
    );
  });

  const in_progress_blocks: string[] = [];

  await Promise.all(
    in_progress_messages.map(async (message: any) => {
      let permalink = await getMessagePermalink(
        TEAM_ASK_CHANNEL_ID,
        message.ts
      );
      if (permalink) {
        in_progress_blocks.push(
          createBlock(
            `<${permalink}|Link to message> from <@${
              message.user
            }> at ${toDateTime(message.ts).toLocaleDateString()}`
          )
        );
      }
    })
  );

  await sendSlackMessage(
    `<#${TEAM_ASK_CHANNEL_ID}> had a *total of ${
      messages.length
    } messages* since ${d.toUTCString()}.\nOut of those, *${
      messages.length - unchecked_messages.length - in_progress_messages.length
    } were handled*, *${in_progress_messages.length} are in progress* and *${
      unchecked_messages.length
    } were not handled*.`,
    event.channel,
    event.thread_ts
  );

  if (in_progress_messages.length > 0) {
    // TODO: Add a text block?
    await sendSlackMessage(
      `These are the in progress asks we currently have:`,
      event.channel,
      event.thread_ts,
      in_progress_blocks
    );
  }

  if (unchecked_messages.length > 0) {
    // TODO: Add a text block?
    await sendSlackMessage(
      `These are the open asks we currently have:`,
      event.channel,
      event.thread_ts,
      unchecked_blocks
    );
  }
};
