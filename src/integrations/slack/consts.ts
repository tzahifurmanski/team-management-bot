const { WebClient } = require("@slack/web-api");

export const SLACK_USER_FORMAT: RegExp = /<@.*>/;

// These will be filled by the loading process
export let BOT_ID: string;
export let TEAM_ASK_CHANNEL_ID: string;
export let TEAM_CHATTER_CHANNEL_ID: string;
export let TEAM_CODE_REVIEW_CHANNEL_ID: string;
export let TEAM_LEADS_CHANNEL_ID: string;
export let BOT_TESTS_CHANNEL_ID: string;
export let ONCALL_CHANNEL_ID: string;
export let GROUP_ASK_CHANNELS_LIST = new Map<string, string>();

export const setSlackConfiguration = function (
  botId: string,
  teamAskChannelId: string,
  teamChatterChannelId: string,
  teamCodeReviewChannelId: string,
  teamLeadsChannelId: string,
  botTestsChannelId: string,
  oncallChannelID: string,
  groupAskChannelsList: Map<string, string>
) {
  BOT_ID = botId;
  TEAM_ASK_CHANNEL_ID = teamAskChannelId;
  TEAM_CHATTER_CHANNEL_ID = teamChatterChannelId;
  TEAM_CODE_REVIEW_CHANNEL_ID = teamCodeReviewChannelId;
  TEAM_LEADS_CHANNEL_ID = teamLeadsChannelId;
  BOT_TESTS_CHANNEL_ID = botTestsChannelId;
  ONCALL_CHANNEL_ID = oncallChannelID;
  GROUP_ASK_CHANNELS_LIST = groupAskChannelsList;
};

const slackToken: string = process.env.BOT_USER_OAUTH_ACCESS_TOKEN || "";
export const SlackWebClient = new WebClient(slackToken);

export const ZENDESK_TOKEN = process.env.ZENDESK_TOKEN || "";
export const ZENDESK_BASE_URL = process.env.ZENDESK_BASE_URL || "";
export const MONITORED_ZENDESK_VIEW = process.env.MONITORED_ZENDESK_VIEW || "";