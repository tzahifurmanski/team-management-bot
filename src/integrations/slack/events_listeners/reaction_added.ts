import { isBotMessage } from "../utils";
import { REACTIONS_HANDLED, TEAM_ASK_CHANNEL_ID } from "../consts";
import { getUserProfile } from "../users";
import { getConversationHistory } from "../conversations";

const reactionAddedCallback = async ({ event, client, logger }: any) => {
  console.log("Got a reaction added callback...", JSON.stringify(event));

  try {
    if (!REACTIONS_HANDLED.includes(event.reaction)) {
      console.log("Irrelevant reaction, skipping.");
      return;
    }

    // Verify we are in the ask channel
    if (event.item.channel != TEAM_ASK_CHANNEL_ID) {
      console.log("BAD CHANNEL", event.channelId, TEAM_ASK_CHANNEL_ID);
      return;
    }

    // TODO: Maybe unneeded - Could it be that the bot is adding emojis?
    if (isBotMessage(event)) {
      console.log("Got a message from bot, ignoring...");
      return;
    }

    // Check if the emoji was applied on a message that is skipped
    const messages = await getConversationHistory(
      client,
      event.item.channel,
      event.item.ts,
      event.item.ts,
      1,
      true
    );
    if (messages.length == 0) {
      // Cant find original message,
      // probably a message that should be skipped,
      // therefore this should not operate on
      console.log("Operation was done on a skipped message, skipping.");
      return;
    }

    const originalMessage = messages[0];
    // console.log("ORIGINAL MESSAGE", JSON.stringify(originalMessage));

    // Check if the reaction is the first one of it's kind
    if (
      originalMessage.reactions?.filter((reaction: any) => {
        return REACTIONS_HANDLED.includes(reaction.name);
      }).length > 1
    ) {
      console.log("More then 1 COMPLETED emoji, skipping");
      return;
    }

    // console.log("Starting logic", event.reaction, REACTIONS_HANDLED);

    // Calculate the time from start to resolution
    const duration = convertSecondsToTime(event.event_ts - event.item.ts);

    const userProfile = (await getUserProfile(client, event.user)) || {};

    // TODO: Instead, should I tag the closing user?
    const promptText = `${
      event.user ? userProfile?.display_name : event.username
    } has resolved this ask after ${duration}.`;

    await client.chat.postMessage({
      channel: event.item.channel,
      thread_ts: event.item.ts,
      text: promptText,
    });

    console.log("Done handling the reaction.", JSON.stringify(event));
  } catch (error) {
    logger.error(error);
  }
};

function convertSecondsToTime(eventDifferenceInSeconds: number) {
  let seconds = Math.floor(eventDifferenceInSeconds);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  seconds = seconds % 60;
  minutes = minutes % 60;
  hours = hours % 24;

  const MESSAGE_SECONDS = `${seconds} ${seconds == 1 ? "second" : "seconds"}`;
  const MESSAGE_MINUTES = `${minutes} ${minutes == 1 ? "minute" : "minutes"}`;
  const MESSAGE_HOURS = `${hours} ${hours == 1 ? "hour" : "hours"}`;
  const MESSAGE_DAYS = `${days}  ${days == 1 ? "day" : "days"}`;

  const timeFormat = days
    ? `${MESSAGE_DAYS}, ${MESSAGE_HOURS}, ${MESSAGE_MINUTES}, and ${MESSAGE_SECONDS}`
    : hours
    ? `${MESSAGE_HOURS}, ${MESSAGE_MINUTES}, and ${MESSAGE_SECONDS}`
    : minutes
    ? `${MESSAGE_MINUTES}, and ${MESSAGE_SECONDS}`
    : `${MESSAGE_SECONDS}`;

  // console.log("Calculated time:", timeFormat);
  return timeFormat;
}

module.exports = { reactionAddedCallback };
