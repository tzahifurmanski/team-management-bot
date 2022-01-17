// General Configurations

// Load the .env file config for debug
if (process.env.NODE_ENV !== 'production') {
    // If there is a custom env file, use it
    console.log(process.env.ENV_FILE);

    // if (process.env.ENV_FILE) {
    if (typeof process.env.ENV_FILE !== 'undefined') {
        // if (process.env.ENV_FILE !== '') {
        console.log("A");
        require('dotenv').config({ path: process.env.ENV_FILE })
    }
    else
    {
        console.log("B");
        require("dotenv").config();
    }
}

export const PORT = process.env.PORT || 3000;

// Bot Configurations
export const BOT_PERSONALITY: string = process.env.BOT_PERSONALITY || "";

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