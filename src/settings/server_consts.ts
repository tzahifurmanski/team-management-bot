// =================================================
//          Env Configurations
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

// Initialize logger
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

// Set the port for the server
export const PORT = process.env.PORT || 3000;

// =================================================
//          Bot Configurations
// =================================================

// Bot Configurations
const BOT_PERSONALITY: string = process.env.BOT_PERSONALITY || "generic";

// Load the configuration specific to the selected bot personality
export const botConfig = require(
  `../../assets/personalities/${BOT_PERSONALITY}/bot_config.json`,
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

import { handleListParameter } from "../utils";

// Reactions parameters
export const REACTIONS_IN_PROGRESS: string[] = handleListParameter(
  process.env.REACTIONS_IN_PROGRESS,
  "in-progress,spinner",
  ",",
);

export const REACTIONS_HANDLED: string[] = handleListParameter(
  process.env.REACTIONS_HANDLED,
  "white_check_mark,heavy_check_mark,green_tick",
  ",",
);

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

// Compliments
export const USER_SPECIFIC_COMPLIMENTS: string[] = handleListParameter(
  process.env.USER_SPECIFIC_COMPLIMENTS,
);
