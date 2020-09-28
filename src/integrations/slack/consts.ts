const config = require("../../../config.json");

export const SLACK_USER_FORMAT = /<@.*>/;

export const BOT_LOGGING_CHANNEL_ID = config.BOT_LOGGING_CHANNEL_ID;
export const BOT_SLACK_ID = config.BOT_SLACK_ID;

// TODO: See if I can remove this (BOT_SLACK_ID was imported before the config was loaded)
export const getBotSlackId = function () {
  return BOT_SLACK_ID;
};

const { WebClient } = require("@slack/web-api");

const token = config.BOT_USER_OAUTH_ACCESS_TOKEN;
export const SlackWebClient = new WebClient(token);
