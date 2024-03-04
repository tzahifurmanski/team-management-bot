// Remove the name of the bot, in case it was mentioned
import { botConfig, logger } from "../../settings/server_consts";
import { BOT_SLACK_ID } from "../../settings/team_consts";

export const sanitizeCommandInput = (text: string): string => {
  return text.replace(`<@${BOT_SLACK_ID}> `, "").trim();
};

// TODO: Change that to be a generic test, so you won't
export const isBotMessage = (event: any): boolean => {
  return (
    event.user === BOT_SLACK_ID ||
    event.username === botConfig.BOT_NAME ||
    event.message?.username === botConfig.BOT_NAME
  );
};

// Limit values from the profile to 3 words
const WORDS_LIMIT = 3;

export const getValueFromProfile = (profile: any, fieldId: string): string => {
  const value = profile?.fields?.[fieldId]?.value
    ? profile.fields[fieldId].value
    : "";
  return value ? value.split(" ").splice(0, WORDS_LIMIT).join(" ") : "Unknown";
};

export const convertSecondsToTimeString = (
  eventDifferenceInSeconds: number,
): string => {
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

  logger.trace("Calculated time:", timeFormat);
  return timeFormat;
};

/*
 * This method will count how many times the reactions in the supplied array appear on the message.
 */
export const countReactions = (message: any, reactions: string[]): number => {
  return message.reactions
    ?.filter((reaction: any) => reactions.includes(reaction.name))
    .map((reaction: any) => reaction.count)
    .reduce((acc: number, reaction: any) => acc + reaction, 0);
};
