// General Configurations

// Load the .env file config for debug
if (process.env.NODE_ENV !== 'production') {
    if (typeof process.env.ENV_FILE !== 'undefined') {
        // If there is a custom env file, use it
        console.log("Loading a custom env file...");
        require('dotenv').config({ path: process.env.ENV_FILE })
    }
    else
    {
        console.log("Loading default env file...");
        require("dotenv").config();
    }
}

export const PORT = process.env.PORT || 3000;

// Bot Configurations
const BOT_PERSONALITY: string = process.env.BOT_PERSONALITY || "generic";

// Load the configuration specific to the selected bot personality
export const botConfig = require(`../assets/personalities/${BOT_PERSONALITY}/bot_config.json`);

// Support a generic bot personality
// =================================

// If we got a bot name, override the default:
const BOT_NAME_PLACEHOLDER = "<BOT_NAME>";
export const BOT_NAME = process.env.BOT_NAME || "";
if(BOT_NAME) {
    botConfig.BOT_NAME=BOT_NAME;
    botConfig.ACTION_INTRODUCE_YOURSELF_TEXT = botConfig.ACTION_INTRODUCE_YOURSELF_TEXT.replace(BOT_NAME_PLACEHOLDER, BOT_NAME);

    console.log(`Set up ${botConfig.BOT_NAME} as the bot name.`);
}

// If we got a bot image, override the default:
const BOT_IMAGE_URL = process.env.BOT_IMAGE_URL || "";
if (BOT_IMAGE_URL) {
    botConfig.BOT_IMAGE_URL = BOT_IMAGE_URL
}

// Bot responses
export const ENABLE_BOT_RESPONSES = process.env.ENABLE_BOT_RESPONSES && process.env.ENABLE_BOT_RESPONSES.toLowerCase() === 'true' || false;

// Scheduling Configurations
export const ASK_CHANNEL_STATS_CRON = process.env.ASK_CHANNEL_STATS_CRON || "30 08 * * 0-5";
export const LEADS_SUMMARY_CRON = process.env.LEADS_SUMMARY_CRON || "0 12 * * 2";
export const ONCALL_TICKETS_STATS_CRON = process.env.ONCALL_TICKETS_STATS_CRON;

// Team Configurations
export const TEAM_NAME = process.env.TEAM_NAME || "";
export const TEAM_FOLKS: string = process.env.TEAM_FOLKS || "team";
export const TEAM_SPECIFIC_COMPLIMENTS: string = process.env.TEAM_SPECIFIC_COMPLIMENTS || "";

// Monitored Channel Configurations
export const MONITORED_CHANNEL_ID: string = process.env.MONITORED_CHANNEL_ID || "";
export const MONITORED_CHANNEL_DAYS_INDEX: string = process.env.MONITORED_CHANNEL_DAYS_INDEX || "";
export const MONITORED_CHANNEL_CONDITION_USERNAME: string = process.env.MONITORED_CHANNEL_CONDITION_USERNAME || "";
export const MONITORED_CHANNEL_CONDITION_MESSAGE_SUCCESS: string = process.env.MONITORED_CHANNEL_CONDITION_MESSAGE_SUCCESS || "";
export const MONITORED_CHANNEL_CONDITION_MESSAGE_FAILURE: string = process.env.MONITORED_CHANNEL_CONDITION_MESSAGE_FAILURE || "";
export const MONITORED_CHANNEL_TRIGGER: string = process.env.MONITORED_CHANNEL_TRIGGER || "";