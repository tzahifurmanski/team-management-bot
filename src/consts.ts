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
const BOT_PERSONALITY: string = process.env.BOT_PERSONALITY || "";

// Load the configuration specific to the selected bot personality
export const botConfig = require(`../assets/personalities/${BOT_PERSONALITY}/bot_config.json`);

// Scheduling Configurations
export const ASK_CHANNEL_STATS_CRON = process.env.ASK_CHANNEL_STATS_CRON;
export const ONCALL_TICKETS_STATS_CRON = process.env.ONCALL_TICKETS_STATS_CRON;

// Team Configurations
export const TEAM_NAME = process.env.TEAM_NAME || "";
export const TEAM_FOLKS: string = process.env.TEAM_FOLKS || "";
export const TEAM_LEADS = process.env.TEAM_LEADS || "";
export const TEAM_SPECIFIC_COMPLIMENTS: string = process.env.TEAM_SPECIFIC_COMPLIMENTS || "";

// Monitored Channel Configurations
export const MONITORED_CHANNEL_ID: string = process.env.MONITORED_CHANNEL_ID || "";
export const MONITORED_CHANNEL_DAYS_INDEX: string = process.env.MONITORED_CHANNEL_DAYS_INDEX || "";
export const MONITORED_CHANNEL_CONDITION_USERNAME: string = process.env.MONITORED_CHANNEL_CONDITION_USERNAME || "";
export const MONITORED_CHANNEL_CONDITION_MESSAGE_SUCCESS: string = process.env.MONITORED_CHANNEL_CONDITION_MESSAGE_SUCCESS || "";
export const MONITORED_CHANNEL_CONDITION_MESSAGE_FAILURE: string = process.env.MONITORED_CHANNEL_CONDITION_MESSAGE_FAILURE || "";
export const MONITORED_CHANNEL_TRIGGER: string = process.env.MONITORED_CHANNEL_TRIGGER || "";