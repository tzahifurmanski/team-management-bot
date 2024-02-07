// =================================================
//          General Configurations
// =================================================
// Load the .env file config for debug
if (process.env.NODE_ENV !== "production") {
  if (typeof process.env.ENV_FILE !== "undefined") {
    // If there is a custom env file, use it
    console.log("Loading a custom env file...");
    require("dotenv").config({ path: process.env.ENV_FILE });
  } else {
    console.log("Loading default env file...");
    require("dotenv").config();
  }
}

import { LogLevel } from "@slack/bolt";

const winston = require("winston");

const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

const { combine, timestamp, json, errors } = winston.format;

export const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || "info",
  format: combine(errors({ stack: true }), timestamp(), json()),

  transports: [new winston.transports.Console()],
});

logger.info(`Logger is set up with ${logger.level} level.`);

// =================================================
//          Utils
// =================================================
//

export const getBoltLogLevel = (logLevel: any) => {
  let boltLogLevel;

  switch (logLevel) {
    case "error":
      boltLogLevel = LogLevel.ERROR;
      break;
    case "warn":
      boltLogLevel = LogLevel.WARN;
      break;
    case "debug":
      boltLogLevel = LogLevel.DEBUG;
      break;
    default:
      // Return INFO as default
      boltLogLevel = LogLevel.INFO;
      break;
  }

  return boltLogLevel;
};

export const handleListParameter = (
  param: string | undefined,
  defaultValue = "",
  delimiter = ",",
  removeEmpty = true,
): string[] => {
  // Check if we got a string that represents an array (or a default value that is an array)
  // If so, split it by the delimiter and optionally remove empty values.
  // Then, return the result
  const fieldContent = param || defaultValue;

  // Split by ,
  let result = fieldContent.split(delimiter);
  if (removeEmpty) {
    result = result.filter((i) => i);
  }
  return result;
};

export const PORT = process.env.PORT || 3000;

// =================================================
//          Bot Configurations
// =================================================
// Bot Configurations
const BOT_PERSONALITY: string = process.env.BOT_PERSONALITY || "generic";

// Load the configuration specific to the selected bot personality
export const botConfig = require(
  `../assets/personalities/${BOT_PERSONALITY}/bot_config.json`,
);

// If we got a bot name, override the default:
const BOT_NAME_PLACEHOLDER = "<BOT_NAME>";
export const BOT_NAME = process.env.BOT_NAME || "";
if (BOT_NAME) {
  botConfig.BOT_NAME = BOT_NAME;
  botConfig.ACTION_INTRODUCE_YOURSELF_TEXT =
    botConfig.ACTION_INTRODUCE_YOURSELF_TEXT.replace(
      BOT_NAME_PLACEHOLDER,
      BOT_NAME,
    );

  logger.info(`Set up "${botConfig.BOT_NAME}" as the bot name.`);
}

// If we got a bot image, override the default:
const BOT_IMAGE_URL = process.env.BOT_IMAGE_URL || "";
if (BOT_IMAGE_URL) {
  botConfig.BOT_IMAGE_URL = BOT_IMAGE_URL;
}

// =================================================
//          Feature Flags
// =================================================

export const ENABLE_ASK_SUMMARY =
  (process.env.ENABLE_ASK_SUMMARY &&
    process.env.ENABLE_ASK_SUMMARY.toLowerCase() === "true") ||
  false;

export const ENABLE_BOT_RESPONSES =
  (process.env.ENABLE_BOT_RESPONSES &&
    process.env.ENABLE_BOT_RESPONSES.toLowerCase() === "true") ||
  false;

// =================================================
//          Features Configurations
// =================================================
//

// Bot responses
export const DISABLED_RESPONSES: string[] = handleListParameter(
  process.env.DISABLED_RESPONSES,
);

export const BOT_RESPONSES_CHANNELS: string[] = handleListParameter(
  process.env.BOT_RESPONSES_CHANNELS,
);

// Scheduling Configurations
export const ASK_CHANNEL_STATS_CRON: string[] = handleListParameter(
  process.env.ASK_CHANNEL_STATS_CRON,
  "",
  "|",
  false,
);
export const ZENDESK_TICKETS_STATS_CRON = handleListParameter(
  process.env.ZENDESK_TICKETS_STATS_CRON,
  "",
  "|",
  false,
);

// Team Configurations
export const TEAM_SPECIFIC_COMPLIMENTS: string[] = handleListParameter(
  process.env.TEAM_SPECIFIC_COMPLIMENTS,
);

// Monitored Channel Configurations
export const MONITORED_CHANNEL_ID: string =
  process.env.MONITORED_CHANNEL_ID || "";
export const MONITORED_CHANNEL_DAYS_INDEX: string =
  process.env.MONITORED_CHANNEL_DAYS_INDEX || "";
export const MONITORED_CHANNEL_CONDITION_USERNAME: string =
  process.env.MONITORED_CHANNEL_CONDITION_USERNAME || "";
export const MONITORED_CHANNEL_CONDITION_MESSAGE_SUCCESS: string =
  process.env.MONITORED_CHANNEL_CONDITION_MESSAGE_SUCCESS || "";
export const MONITORED_CHANNEL_CONDITION_MESSAGE_FAILURE: string =
  process.env.MONITORED_CHANNEL_CONDITION_MESSAGE_FAILURE || "";
export const MONITORED_CHANNEL_TRIGGER: string =
  process.env.MONITORED_CHANNEL_TRIGGER || "";
