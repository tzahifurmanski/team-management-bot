const config = require("../../../config.json");
const { WebClient } = require("@slack/web-api");

export const SLACK_USER_FORMAT: RegExp = /<@.*>/;

// These will be filled by the loading process
export let BOT_ID: string;
export let TEAM_ASK_CHANNEL_ID: string;

export const setSlackIds = function (botId: string, teamAskChannelId: string) {
  BOT_ID = botId;
  TEAM_ASK_CHANNEL_ID = teamAskChannelId;
};

const token: string = config.BOT_USER_OAUTH_ACCESS_TOKEN;
export const SlackWebClient = new WebClient(token);
