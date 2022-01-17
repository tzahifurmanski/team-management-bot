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

// Bot Configurations
export let BOT_TESTS_CHANNEL_ID: string = process.env.BOT_TESTS_CHANNEL_ID || "";
const BOT_TESTS_CHANNEL_NAME: string = process.env.BOT_TESTS_CHANNEL_NAME || "";

// Channels Configurations
export let TEAM_ASK_CHANNEL_ID: string = process.env.TEAM_ASK_CHANNEL_ID || "";
const TEAM_ASK_CHANNEL_NAME: string = process.env.TEAM_ASK_CHANNEL_NAME || "";
export let TEAM_CHATTER_CHANNEL_ID: string = process.env.TEAM_CHATTER_CHANNEL_ID || "";
const TEAM_CHATTER_CHANNEL_NAME: string = process.env.TEAM_CHATTER_CHANNEL_NAME || "";
export let TEAM_LEADS_CHANNEL_ID: string = process.env.TEAM_LEADS_CHANNEL_ID || "";
const TEAM_LEADS_CHANNEL_NAME: string = process.env.TEAM_LEADS_CHANNEL_NAME || "";
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
export const loadSlackConfig = async function () {
  console.log("Starting Slack config load...");
  try {
    const botId = await getBotId();

    const teamAskChannelId = TEAM_ASK_CHANNEL_ID || await getConversationId(TEAM_ASK_CHANNEL_NAME);

    const teamChatterChannelId = TEAM_CHATTER_CHANNEL_ID || await getConversationId(TEAM_CHATTER_CHANNEL_NAME);

    const teamCodeReviewChannelId = TEAM_CODE_REVIEW_CHANNEL_ID || await getConversationId(TEAM_CODE_REVIEW_CHANNEL_NAME);

    const teamLeadsChannelId = TEAM_LEADS_CHANNEL_ID || await getConversationId(TEAM_LEADS_CHANNEL_NAME);

    const botTestsChannelId = BOT_TESTS_CHANNEL_ID || await getConversationId(BOT_TESTS_CHANNEL_NAME);

    const oncallChannelId = ONCALL_CHANNEL_ID || await getConversationId(ONCALL_CHANNEL_NAME);

    // TODO: Allow to add defaults
    const groupAsksChannelsList = new Map<string, string>();

    const asksChannels = GROUP_ASK_CHANNELS.split(",");
    asksChannels.forEach((channelDetails: string) => {
      const details = channelDetails.split(":");
      groupAsksChannelsList.set(details[0], details[1]);
    });

    groupAsksChannelsList.set(
        TEAM_ASK_CHANNEL_NAME,
        teamAskChannelId
    );

    // TODO: Do I need the temp consts, or could I just do the operation directly on the let variables
    // Set the exported configurations
    BOT_ID = botId;
    TEAM_ASK_CHANNEL_ID = teamAskChannelId;
    TEAM_CHATTER_CHANNEL_ID = teamChatterChannelId;
    TEAM_CODE_REVIEW_CHANNEL_ID = teamCodeReviewChannelId;
    TEAM_LEADS_CHANNEL_ID = teamLeadsChannelId;
    BOT_TESTS_CHANNEL_ID = botTestsChannelId;
    ONCALL_CHANNEL_ID = oncallChannelId;
    GROUP_ASK_CHANNELS_LIST = groupAsksChannelsList;

    console.log("Slack config completed successfully.");
  } catch (err) {
    console.log("Error while loading Slack Dynamic vars!", err);
    return false;
  }

  return true;
};