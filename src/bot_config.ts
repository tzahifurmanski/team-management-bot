const bot_config = require("../config.json");

export const BOT_PERSONALITY: string = bot_config.BOT_PERSONALITY;

// Load the configuration specific to the selected bot personality
export const botConfig = require(`../personalities/${BOT_PERSONALITY}/bot_config.json`);

// TODO: Add a verification that the loaded personality has all required fields?
