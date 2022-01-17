// Load the configuration specific to the selected bot personality
import {BOT_PERSONALITY} from "./consts";

export const botConfig = require(`../assets/personalities/${BOT_PERSONALITY}/bot_config.json`);

// TODO: Add a verification that the loaded personality has all required fields?
