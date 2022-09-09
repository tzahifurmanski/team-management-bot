// TODO: Make sure to load src/consts before loading this - Instead, maybe load the dotenv conf?

import {getBotId, getConversationId} from "./conversations";

const { WebClient } = require("@slack/web-api");

export const SLACK_USER_FORMAT: RegExp = /<@.*>/;

// User-Specific Tokens Configurations
export const SLACK_SIGNING_SECRET: string = process.env.SLACK_SIGNING_SECRET || "";
const slackToken: string = process.env.BOT_USER_OAUTH_ACCESS_TOKEN || "";
export const SlackWebClient = new WebClient(slackToken);


// These will be resolved by the loadSlackConfig process

export let BOT_ID: string;

// Channels Configurations

// Asks channel stats
export let TEAM_ASK_CHANNEL_ID: string = process.env.TEAM_ASK_CHANNEL_ID || "";
const TEAM_ASK_CHANNEL_NAME: string = process.env.TEAM_ASK_CHANNEL_NAME || "";

// User profile field ids
export const USER_PROFILE_FIELD_ID_TEAM = process.env.USER_PROFILE_FIELD_ID_TEAM || "";
export const USER_PROFILE_FIELD_ID_DEPARTMENT = process.env.USER_PROFILE_FIELD_ID_DEPARTMENT || "";
export const USER_PROFILE_FIELD_ID_DIVISION = process.env.USER_PROFILE_FIELD_ID_DIVISION || "";

// Reactions parameters
const reactionsInProgressParam = (process.env.REACTIONS_IN_PROGRESS || "in-progress,spinner");
const reactionsHandledParam = (process.env.REACTIONS_HANDLED || "white_check_mark,heavy_check_mark,green_tick");
export const REACTIONS_IN_PROGRESS : string[] = reactionsInProgressParam.split(",");
export const REACTIONS_HANDLED : string[] = reactionsHandledParam.split(",");

// Cron jobs
// =============

// Leads summary
export let LEADS_SUMMARY_CHANNEL_ID: string = process.env.LEADS_SUMMARY_CHANNEL_ID || "";
export const LEADS_SUMMARY_CHANNEL_NAME: string = process.env.LEADS_SUMMARY_CHANNEL_NAME || "";

// Responses
// ==========
export let TEAM_CODE_REVIEW_CHANNEL_ID: string = process.env.TEAM_CODE_REVIEW_CHANNEL_ID || "";
const TEAM_CODE_REVIEW_CHANNEL_NAME: string = process.env.TEAM_CODE_REVIEW_CHANNEL_NAME || "";

const GROUP_ASK_CHANNELS: string = process.env.GROUP_ASK_CHANNELS || ""
export let GROUP_ASK_CHANNELS_LIST = new Map<string, string>();

// Zendesk Integration Configurations
export const ZENDESK_TOKEN = process.env.ZENDESK_TOKEN || "";
export const ZENDESK_BASE_URL = process.env.ZENDESK_BASE_URL || "";

// Oncall Tickets Status Configurations
export const MONITORED_ZENDESK_VIEW = process.env.MONITORED_ZENDESK_VIEW || "";
export let ONCALL_CHANNEL_ID: string = process.env.ONCALL_CHANNEL_ID || "";
const ONCALL_CHANNEL_NAME: string = process.env.ONCALL_CHANNEL_NAME || "";


// Resolve the slack dynamic variables
export const loadSlackConfig = async () => {
  console.log("Starting Slack config load...");
  try {
    BOT_ID = await getBotId();
    console.log(`Loaded bot id ${BOT_ID}`)

    TEAM_ASK_CHANNEL_ID = TEAM_ASK_CHANNEL_ID || await getConversationId(TEAM_ASK_CHANNEL_NAME);

    TEAM_CODE_REVIEW_CHANNEL_ID = TEAM_CODE_REVIEW_CHANNEL_ID || await getConversationId(TEAM_CODE_REVIEW_CHANNEL_NAME);

    LEADS_SUMMARY_CHANNEL_ID = LEADS_SUMMARY_CHANNEL_ID || await getConversationId(LEADS_SUMMARY_CHANNEL_NAME);

    ONCALL_CHANNEL_ID = ONCALL_CHANNEL_ID || await getConversationId(ONCALL_CHANNEL_NAME);

    // TODO: Allow to add defaults
    GROUP_ASK_CHANNELS_LIST = new Map<string, string>();

    const asksChannels = GROUP_ASK_CHANNELS.split(",");
    asksChannels.forEach((channelDetails: string) => {
      const details = channelDetails.split(":");
      GROUP_ASK_CHANNELS_LIST.set(details[0], details[1]);
    });

    console.log("Slack config completed successfully.");
  } catch (err) {
    console.log("Error while loading Slack Dynamic vars!", err);
    return false;
  }

  return true;
};