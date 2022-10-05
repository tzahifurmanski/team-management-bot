// TODO: Make sure to load src/consts before loading this - Instead, maybe load the dotenv conf?

import { getBotId, getConversationId } from "./conversations";

const handleListParameter = (
  param: string | undefined,
  defaultValue = "",
  delimiter = ","
): string[] => {
  const fieldContent = param || defaultValue;

  // Split by , and remove empty elements
  return fieldContent.split(delimiter).filter((i) => i);
};

export const SLACK_USER_FORMAT = /<@.*>/;

// User-Specific Tokens Configurations
export const SLACK_SIGNING_SECRET: string =
  process.env.SLACK_SIGNING_SECRET || "";

// TODO: Remove once the cron jobs are moved.
export let SlackWebClient: any;

// These will be resolved by the loadSlackConfig process

export let BOT_ID: string;

// Channels Configurations

// Asks channel stats
export let TEAM_ASK_CHANNEL_ID: string = process.env.TEAM_ASK_CHANNEL_ID || "";
const TEAM_ASK_CHANNEL_NAME: string = process.env.TEAM_ASK_CHANNEL_NAME || "";

export const ALLOWED_BOTS: string[] = handleListParameter(
  process.env.ALLOWED_BOTS,
  "",
  ","
);

// User profile field ids
export const USER_PROFILE_FIELD_ID_TEAM =
  process.env.USER_PROFILE_FIELD_ID_TEAM || "";
export const USER_PROFILE_FIELD_ID_DEPARTMENT =
  process.env.USER_PROFILE_FIELD_ID_DEPARTMENT || "";
export const USER_PROFILE_FIELD_ID_DIVISION =
  process.env.USER_PROFILE_FIELD_ID_DIVISION || "";

// Reactions parameters
export const REACTIONS_IN_PROGRESS: string[] = handleListParameter(
  process.env.REACTIONS_IN_PROGRESS,
  "in-progress,spinner",
  ","
);
export const REACTIONS_HANDLED: string[] = handleListParameter(
  process.env.REACTIONS_HANDLED,
  "white_check_mark,heavy_check_mark,green_tick",
  ","
);

// Cron jobs
// =============

// Leads summary
export let LEADS_SUMMARY_CHANNEL_ID: string =
  process.env.LEADS_SUMMARY_CHANNEL_ID || "";
export const LEADS_SUMMARY_CHANNEL_NAME: string =
  process.env.LEADS_SUMMARY_CHANNEL_NAME || "";

// Responses
// ==========
export let TEAM_CODE_REVIEW_CHANNEL_ID: string =
  process.env.TEAM_CODE_REVIEW_CHANNEL_ID || "";
const TEAM_CODE_REVIEW_CHANNEL_NAME: string =
  process.env.TEAM_CODE_REVIEW_CHANNEL_NAME || "";

const GROUP_ASK_CHANNELS: string = process.env.GROUP_ASK_CHANNELS || "";
export let GROUP_ASK_CHANNELS_LIST = new Map<string, string>();

// Zendesk Integration Configurations
export const ZENDESK_TOKEN = process.env.ZENDESK_TOKEN || "";
export const ZENDESK_BASE_URL = process.env.ZENDESK_BASE_URL || "";

// Oncall Tickets Status Configurations
export const MONITORED_ZENDESK_VIEW = process.env.MONITORED_ZENDESK_VIEW || "";
export const MONITORED_ZENDESK_FILTER_FIELD_ID =
  process.env.MONITORED_ZENDESK_FILTER_FIELD_ID || "";

export const MONITORED_ZENDESK_FILTER_FIELD_VALUES: string[] =
  handleListParameter(
    process.env.MONITORED_ZENDESK_FILTER_FIELD_VALUES,
    "",
    ","
  );

export let ONCALL_CHANNEL_ID: string = process.env.ONCALL_CHANNEL_ID || "";
const ONCALL_CHANNEL_NAME: string = process.env.ONCALL_CHANNEL_NAME || "";

// Resolve the slack dynamic variables
export const loadSlackConfig = async (slackClient: any) => {
  console.log("Starting Slack config load...");
  try {
    BOT_ID = await getBotId(slackClient);
    console.log(`Loaded bot id ${BOT_ID}`);

    TEAM_ASK_CHANNEL_ID =
      TEAM_ASK_CHANNEL_ID ||
      (await getConversationId(slackClient, TEAM_ASK_CHANNEL_NAME));

    TEAM_CODE_REVIEW_CHANNEL_ID =
      TEAM_CODE_REVIEW_CHANNEL_ID ||
      (await getConversationId(slackClient, TEAM_CODE_REVIEW_CHANNEL_NAME));

    LEADS_SUMMARY_CHANNEL_ID =
      LEADS_SUMMARY_CHANNEL_ID ||
      (await getConversationId(slackClient, LEADS_SUMMARY_CHANNEL_NAME));

    ONCALL_CHANNEL_ID =
      ONCALL_CHANNEL_ID ||
      (await getConversationId(slackClient, ONCALL_CHANNEL_NAME));

    // TODO: Allow to add defaults
    GROUP_ASK_CHANNELS_LIST = new Map<string, string>();

    const asksChannels = GROUP_ASK_CHANNELS.split(",");
    asksChannels.forEach((channelDetails: string) => {
      const details = channelDetails.split(":");
      GROUP_ASK_CHANNELS_LIST.set(details[0], details[1]);
    });

    // Set global slack client to use in cron jobs
    SlackWebClient = slackClient;

    console.log("Slack config completed successfully.");
  } catch (err) {
    console.log("Error while loading Slack Dynamic vars!", err);
    return false;
  }

  return true;
};
