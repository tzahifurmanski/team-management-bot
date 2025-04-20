import cronstrue from "cronstrue";
import { AsksChannelStatsResult } from "../logic/asks_channel.js";
import { logger } from "../settings/server_consts.js";
import { Team } from "../settings/team_consts.js";
import cron from "node-cron";

export const getRandomFromArray = (array: any[]) => {
  const random = Math.floor(Math.random() * array.length);
  return array[random];
};

export class AskChannelParams {
  constructor(
    public actionType: string,
    public count: number,
    public timeMetric: string,
    public groupBy: string,
    public channel_id_slot: number,
    public error?: string,
  ) {}
}

// TODO: Refactor this to be cleaner
export const getAskChannelParameters = (ask: string): AskChannelParams => {
  // Check that we got enough params
  const askArray = ask.split(" ");
  logger.trace(`askArray: ${askArray}`);

  let actionType;
  let groupBy;
  let timeMetric;
  let count;
  let channel_id_slot;

  // Verify we got exactly 8 params - 'ask channel stats/status <#CHANNEL_NAME> <COUNT> <TIME_PERIOD>' by days/weeks/months
  if (askArray.length === 8) {
    // Get values from params
    actionType = askArray[2];
    channel_id_slot = 3;
    count = askArray[4];
    timeMetric = askArray[5];
    groupBy = askArray[7];
  }
  // Verify we got exactly 6 params - 'ask channel stats/status <#CHANNEL_NAME> <COUNT> <TIME_PERIOD>'
  else if (askArray.length === 6) {
    // Get values from params
    actionType = askArray[2];
    channel_id_slot = 3;

    // Check if we got 'ask channel stats/status <#CHANNEL_NAME> by days/weeks/months' format
    if (askArray[4] === "by") {
      timeMetric = "days";
      count = 7;
      groupBy = askArray[5];
    } else {
      count = askArray[4];
      timeMetric = askArray[5];
      groupBy = "";
    }
  }

  // Check if we got the default version of 'ask channel stats <#CHANNEL_NAME>'
  else if (askArray.length === 4) {
    // Use defaults - 7 days
    actionType = askArray[2];
    timeMetric = "days";
    count = 7;
    groupBy = "";
    channel_id_slot = 3;
  } else if (askArray.length === 3) {
    return new AskChannelParams("", -1, "", "", -1, "Missing channel ID");
  } else {
    return new AskChannelParams("", -1, "", "", -1, "Not all params provided");
  }

  // Validate the action type
  if (!["stats", "status", "summary"].includes(actionType)) {
    // Return error
    return new AskChannelParams(
      "",
      -1,
      "",
      "",
      -1,
      "Invalid action type provided",
    );
  }

  // Validate the number of days
  if (isNaN(Number(count)) || Number(count) < 1) {
    return new AskChannelParams("", -1, "", "", -1, "Invalid count provided");
  }

  // If the user has supplied a singular criteria, change it to plural
  if (Number(count) === 1 && ["day", "week", "month"].includes(timeMetric)) {
    timeMetric += "s";
  }

  if (!["days", "weeks", "months"].includes(timeMetric)) {
    // Return error
    return new AskChannelParams(
      "",
      -1,
      "",
      "",
      -1,
      "Invalid time metric provided",
    );
  }

  if (groupBy && !["days", "weeks", "months"].includes(groupBy)) {
    // Return error
    return new AskChannelParams(
      "",
      -1,
      "",
      "",
      -1,
      "Invalid group by clause provided",
    );
  }

  return new AskChannelParams(
    actionType,
    Number(count),
    timeMetric,
    groupBy,
    Number(channel_id_slot),
    "",
  );
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
): string => {
  const askChannelID = extractIDFromChannelString(
    eventText.split(" ")[nameIndex],
  );
  logger.debug(`Found channel ID ${askChannelID}.`);

  return askChannelID;
};

export const scheduleAskChannelsCrons = (
  slackClient: any,
  teams: Team[],
  channel_id_attribute: keyof Team,
  channel_name_attribute: keyof Team,
  cron_attribute: keyof Team,
  action: string,
  functionToSchedule: any,
) => {
  // Get all the teams that have a cron set
  const teamsWithCrons = teams.filter(
    (team: Team) => !!team[channel_id_attribute],
  );

  teamsWithCrons.forEach((team: Team) => {
    const eventText = {
      channel: team.ask_channel_id,
      thread_ts: "",
      scheduled: true,
      text: `${action} <#${team[channel_id_attribute]}|${team[channel_name_attribute]}>`,
    };

    // TODO: SlackWebClient is passed 'by value', and when it does, it is empty. Fix this.
    scheduleCron(
      !!team[cron_attribute],
      `update on ${team[channel_name_attribute]} ${action}`,
      <string>team[cron_attribute],
      functionToSchedule,
      eventText,
      slackClient,
    );
  });
};

// TODO: This doesn't really check what is configured in cron, but rather the configuration that should have been applied
export const getRecurringJobInfo = (
  jobName: string,
  teams: Team[],
  channel_id_attribute: keyof Team,
  cron_attribute: keyof Team,
): string => {
  if (teams.length == 0) {
    return "";
  }
  // Get all the teams that have a cron set
  const teamsWithCrons = teams.filter((team: Team) => !!team[cron_attribute]);

  let message = "";
  teamsWithCrons.forEach((team: Team) => {
    message += `\n*A recurring ${jobName} in <#${
      team[channel_id_attribute]
    }> is scheduled to be sent ${cronstrue.toString(<string>team[cron_attribute])}.*`;
  });

  return message;
};
