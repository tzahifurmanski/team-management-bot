import cronstrue from "cronstrue";
import { AsksChannelStatsResult } from "../logic/asks_channel";
import { sanitizeCommandInput } from "../integrations/slack/utils";
import { logger } from "../consts";

const cron = require("node-cron");

export const getRandomFromArray = (array: any[]) => {
  const random = Math.floor(Math.random() * array.length);
  return array[random];
};

export const toDateTime = (secs: any): Date => {
  const time = new Date(1970, 0, 1); // Set to Epoch
  time.setSeconds(secs);
  return time;
};

// This method takes a UTC date and removes all time information from it
// Note that:
// 1. This method changes the input date.
// 2. The input date is expected to be in UTC time.
export const removeTimeInfoFromDate = (date: Date): Date => {
  date.setUTCHours(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);

  return date;
};

// This function receives a date object, and returns the same date object with the date set to the previous Sunday, without time info.
// If the provided date is already a sunday, it will return the same date.
export const setDateToSunday = (date: Date): Date => {
  const day = date.getUTCDay();
  const diff = date.getDate() - day;

  date = removeTimeInfoFromDate(new Date(date.setDate(diff)));
  return date;
};

export class AskChannelParams {
  constructor(
    public actionType: string,
    public count: number,
    public timeMetric: string,
    public groupBy: string,
    public error?: string,
  ) {}
}

// TODO: Refactor this to be cleaner
export const getAskChannelParameters = (ask: string): AskChannelParams => {
  // Check that we got enough params
  const askArray = ask.split(" ");
  let actionType;
  let groupBy;
  let timeMetric;
  let count;

  // Verify we got exactly 7 params - 'ask channel stats/status <COUNT> <TIME_PERIOD>' by days/weeks/months
  if (askArray.length === 7) {
    // Get values from params
    actionType = askArray[2];
    count = askArray[3];
    timeMetric = askArray[4];
    groupBy = askArray[6];
  }
  // Verify we got exactly 5 params - 'ask channel stats/status <COUNT> <TIME_PERIOD>'
  else if (askArray.length === 5) {
    // Get values from params
    actionType = askArray[2];

    // Check if we got 'ask channel stats/status by days/weeks/months' format
    if (askArray[3] === "by") {
      timeMetric = "days";
      count = 7;
      groupBy = askArray[4];
    } else {
      count = askArray[3];
      timeMetric = askArray[4];
      groupBy = "";
    }
  }
  // Check if we got the default version of 'ask channel stats'
  else if (askArray.length === 3) {
    // Use defaults - 7 days
    actionType = askArray[2];
    timeMetric = "days";
    count = 7;
    groupBy = "";
  } else {
    return new AskChannelParams("", -1, "", "", "Not all params provided");
  }

  // Validate the action type
  if (!["stats", "status", "summary"].includes(actionType)) {
    // Return error
    return new AskChannelParams("", -1, "", "", "Invalid action type provided");
  }

  // Validate the number of days
  if (Number(count) === undefined || Number(count) < 1) {
    return new AskChannelParams("", -1, "", "", "Invalid count provided");
  }

  // If the user has supplied a singular criteria, change it to plural
  if (Number(count) === 1 && ["day", "week", "month"].includes(timeMetric)) {
    timeMetric += "s";
  }

  if (!["days", "weeks", "months"].includes(timeMetric)) {
    // Return error
    return new AskChannelParams("", -1, "", "", "Invalid time metric provided");
  }

  if (groupBy && !["days", "weeks", "months"].includes(groupBy)) {
    // Return error
    return new AskChannelParams(
      "",
      -1,
      "",
      "",
      "Invalid group by clause provided",
    );
  }

  return new AskChannelParams(
    actionType,
    Number(count),
    timeMetric,
    groupBy,
    "",
  );
};

export const getStartingDate = (params: AskChannelParams): Date => {
  // How to calculate:
  // For days - count backwards from today
  // For weeks - count backwards from the beginning of the week
  // For months - count backwards from the beginning of the month
  let startingDate;

  const adjustedCount = params.count - 1; // Remove 1 from the number of requested count,
  // so '1' will be treated as 'this' (AKA '1 day' will be beginning of today, '1 week' will be beginning of this week,
  // and '1 month' will be beginning of this month)

  // Get the starting date - Days
  if (params.timeMetric === "days") {
    startingDate = new Date();
    startingDate.setDate(startingDate.getDate() - adjustedCount);
    removeTimeInfoFromDate(startingDate);
  } else if (params.timeMetric === "weeks") {
    startingDate = setDateToSunday(new Date());
    startingDate.setDate(startingDate.getDate() - 7 * adjustedCount);
    removeTimeInfoFromDate(startingDate);
  } else {
    // Get the timeframe for the beginning of the month
    const date = new Date();
    startingDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth() - adjustedCount, 1, 0),
    );
  }

  return startingDate;
};

export const scheduleCron = (
  condition: boolean,
  description: string,
  cronExpression: string,
  functionToSchedule: any,
  event: any,
  slackClient: any,
) => {
  if (condition) {
    logger.info(
      `Setting up a cron to ${description} ${cronstrue.toString(
        cronExpression,
      )}.`,
    );
    cron.schedule(cronExpression, () => {
      functionToSchedule(event, slackClient);
    });
  } else {
    logger.info(`Skipping on setting up a cron to ${description}.`);
  }
};

export const getStatsMessage = (
  channelId: string,
  stats: AsksChannelStatsResult,
): string => {
  let summary = `<#${channelId}> received *${stats.totalMessages} new asks*:\n`;
  summary =
    summary +
    `• *${stats.totalNumUnchecked}* Not Handled :mailbox_with_mail:\n`;
  summary =
    summary + `• *${stats.totalNumInProgress}* In Progress :in-progress:\n`;
  summary =
    summary + `• *${stats.totalNumProcessed}* Resolved :white_check_mark:`;

  return summary;
};

const SLACK_CHANNEL_NAME_REGEX = /^<#C[A-Z0-9]{8,10}\|.*>$/;

export const extractNameFromChannelString = (channelString: string): string => {
  // The channel string is in the format <#C12345678|channel-name>, we want to return the channel name
  // Example: <#C12345678|channel-name> -> channel-name
  if (!SLACK_CHANNEL_NAME_REGEX.test(channelString.trim())) {
    logger.debug(
      `NO MATCH for ${channelString} in ${SLACK_CHANNEL_NAME_REGEX}`,
    );
    // If the channel string is not in the format <#C12345678|channel-name>, return empty
    return "";
  }

  return channelString.replace(">", "").trim().split("|")[1];
};

export const extractIDFromChannelString = (channelString: string): string => {
  // The channel string is in the format <#C12345678|channel-name>, we want to return the channel name
  // Example: <#C12345678|channel-name> -> channel-name
  if (!SLACK_CHANNEL_NAME_REGEX.test(channelString.trim())) {
    logger.debug(
      `NO MATCH for ${channelString} in ${SLACK_CHANNEL_NAME_REGEX}`,
    );
    // If the channel string is not in the format <#C12345678|channel-name>, return empty
    return "";
  }

  return channelString.replace("<#", "").trim().split("|")[0];
};

export const getChannelIDFromEventText = (
  eventText: any,
  nameIndex: number,
  defaultID: string,
) => {
  let askChannelID;

  // If there's a sixth word, then it's a channel name
  const params = eventText.split(" ");

  // Check if no channel ID was provided
  if (
    !(
      sanitizeCommandInput(eventText).startsWith("ask channel status") ||
      sanitizeCommandInput(eventText).startsWith("zendesk tickets status")
    ) ||
    params.length === nameIndex
  ) {
    // Take default
    askChannelID = defaultID;
    logger.debug(`Using default channel ID ${askChannelID}.`);
  } else {
    askChannelID = extractIDFromChannelString(params[nameIndex]);
    logger.debug(`Found channel ID ${askChannelID}.`);
  }

  return askChannelID;
};

export const scheduleAskChannelsCrons = (
  slackClient: any,
  crons: string[],
  channelIds: string[],
  channelNames: string[],
  action: string,
  functionToSchedule: any,
) => {
  // Schedule the crons for the ask channels
  if (crons.length != channelIds.length) {
    logger.info(
      `cron (${crons}, ${crons.length}) and channelIds (${channelIds}, ${channelIds.length}) have different lengths, and therefor crons won't be scheduled.`,
    );
    return;
  }

  // Iterate over the crons and schedule them
  for (let i = 0; i < crons.length; i++) {
    const eventText = {
      channel: channelIds[i],
      thread_ts: "",
      scheduled: true,
      text: `${action} <#${channelIds[i]}|${channelNames[i]}>`,
    };

    // TODO: SlackWebClient is passed 'by value', and when it does, it is empty. Fix this.
    scheduleCron(
      !!crons[i],
      `update on ${channelNames[i]} ${action}`,
      crons[i],
      functionToSchedule,
      eventText,
      slackClient,
    );
  }
};

export const getRecurringJobInfo = (
  jobName: string,
  crons: string[],
  channelIds: string[],
): string => {
  if (crons.length == 0) {
    return "";
  }

  let message = "";
  for (let i = 0; i < crons.length; i++) {
    // If a schedule is set, add it to the help message
    if (crons[i]) {
      message += `\n*A recurring ${jobName} in <#${
        channelIds[i]
      }> is scheduled to be sent ${cronstrue.toString(crons[i])}.*`;
    }
  }

  return message;
};
