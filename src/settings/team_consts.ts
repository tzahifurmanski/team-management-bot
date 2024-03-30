// TODO: Make sure to load server_consts.ts before loading this - Instead, maybe load the dotenv conf?

import {
  getBotId,
  getConversationId,
} from "../integrations/slack/conversations";
import { logger } from "./server_consts";
import { handleListParameter } from "../utils";
import { setSlackWebClient } from "../integrations/consts";
import { isTeam } from "./team_utils";

// ====================
// Teams Configurations
// ====================

// Settings for a team
export interface Team {
  // Ask channel
  ask_channel_id: string;
  ask_channel_name: string;
  ask_channel_cron: string;
  allowed_bots: string[];
  ask_channel_cron_last_sent: Date; // Keep track of the last time a scheduled message was sent

  // Zendesk Integration
  zendesk_channel_id: string;
  zendesk_channel_name: string;
  zendesk_monitored_view_id: string;
  zendesk_aggregated_field_id: string;
  zendesk_field_id: string;
  zendesk_field_values: string[];
  zendesk_channel_cron: string;
}


const TEAMS_JSON_LIST: string[] = handleListParameter(
  process.env.TEAMS_JSON_LIST,
  "",
  "|",
);

// A teams list with the ask channel id as the key
export const TEAMS_LIST = new Map<string, Team>();

// Channels Configurations
// Asks channel stats
// TODO: Remove 'export' - There are still a lot of places the don't support multi channels, so they default to using the [0] ID
export const TEAM_ASK_CHANNEL_ID: string[] = handleListParameter(
  process.env.TEAM_ASK_CHANNEL_ID,
);
const TEAM_ASK_CHANNEL_NAME: string[] = handleListParameter(
  process.env.TEAM_ASK_CHANNEL_NAME,
);

const ALLOWED_BOTS: string[] = handleListParameter(
  process.env.ALLOWED_BOTS,
  "",
  "|",
  false,
);

// Scheduling Configurations
const ASK_CHANNEL_STATS_CRON: string[] = handleListParameter(
  process.env.ASK_CHANNEL_STATS_CRON,
  "",
  "|",
  false,
);

const ZENDESK_TICKETS_STATS_CRON = handleListParameter(
  process.env.ZENDESK_TICKETS_STATS_CRON,
  "",
  "|",
  false,
);

let ALLOWED_BOTS_PER_TEAM = new Map<string, string[]>();

// User profile field ids
export const USER_PROFILE_FIELD_ID_TEAM =
  process.env.USER_PROFILE_FIELD_ID_TEAM || "";
export const USER_PROFILE_FIELD_ID_DEPARTMENT =
  process.env.USER_PROFILE_FIELD_ID_DEPARTMENT || "";
export const USER_PROFILE_FIELD_ID_DIVISION =
  process.env.USER_PROFILE_FIELD_ID_DIVISION || "";

// Responses
// ==========

// TODO: ATM these does not support multi-teams
export let TEAM_CODE_REVIEW_CHANNEL_ID: string =
  process.env.TEAM_CODE_REVIEW_CHANNEL_ID || "";
const TEAM_CODE_REVIEW_CHANNEL_NAME: string =
  process.env.TEAM_CODE_REVIEW_CHANNEL_NAME || "";

const GROUP_ASK_CHANNELS: string = process.env.GROUP_ASK_CHANNELS || "";
export let GROUP_ASK_CHANNELS_LIST = new Map<string, string>();

// Zendesk Tickets Status Configurations
const ZENDESK_MONITORED_VIEW = handleListParameter(
  process.env.ZENDESK_MONITORED_VIEW,
);

const ZENDESK_VIEW_AGGREGATED_FIELD_ID = handleListParameter(
  process.env.ZENDESK_VIEW_AGGREGATED_FIELD_ID,
  "",
  ",",
  false,
);

export const ZENDESK_TICKETS_CHANNEL_ID: string[] = handleListParameter(
  process.env.ZENDESK_TICKETS_CHANNEL_ID,
  "",
  ",",
  false,
);
const ZENDESK_TICKETS_CHANNEL_NAME: string[] = handleListParameter(
  process.env.ZENDESK_TICKETS_CHANNEL_NAME,
  "",
  ",",
  false,
);

const MONITORED_ZENDESK_FILTER_FIELD_ID =
  process.env.MONITORED_ZENDESK_FILTER_FIELD_ID || "";

const MONITORED_ZENDESK_FILTER_FIELD_VALUES: string[] =
  handleListParameter(
    process.env.MONITORED_ZENDESK_FILTER_FIELD_VALUES,
    "",
    ",",
    false,
  );

// TODO: This also doesn't support multi teams
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


// TODO: TEMP Method
const getArrayValue = (arr: string[], index: number, detault_value: string): string => {
  return index < arr.length ? arr[index] : detault_value
}

// Resolve the slack dynamic variables
export const loadConfig = async (slackClient: any) => {
  logger.info("Starting Slack config load...");
  try {
    const botSlackID = await getBotId(slackClient);
    setBotSlackId(botSlackID);

    logger.info(`Loaded bot id ${BOT_SLACK_ID}`);

    if (TEAM_ASK_CHANNEL_ID.length === 0) {
      // If there are no channel ids, resolve them by names
      for (const channelName of TEAM_ASK_CHANNEL_NAME) {
        const channelId: string = await getConversationId(
          slackClient,
          channelName,
        );
        TEAM_ASK_CHANNEL_ID.push(channelId);
      }
    } else if (TEAM_ASK_CHANNEL_ID.length != TEAM_ASK_CHANNEL_NAME.length) {
      logger.error(
        `Error: TEAM_ASK_CHANNEL_ID ${TEAM_ASK_CHANNEL_ID.length} and TEAM_ASK_CHANNEL_NAME ${TEAM_ASK_CHANNEL_NAME.length} have different lengths`,
      );
      return false;
    } else if (TEAM_ASK_CHANNEL_ID.length != ALLOWED_BOTS.length) {
      logger.error(
        `Error: TEAM_ASK_CHANNEL_ID ${TEAM_ASK_CHANNEL_ID.length} and ALLOWED_BOTS ${ALLOWED_BOTS.length} have different lengths`,
      );
      return false;
    }
    if (TEAM_ASK_CHANNEL_ID.length != ZENDESK_TICKETS_CHANNEL_ID.length) {
      logger.error(
        `Error: TEAM_ASK_CHANNEL_ID ${TEAM_ASK_CHANNEL_ID.length} and ZENDESK_TICKETS_CHANNEL_ID ${ZENDESK_TICKETS_CHANNEL_ID.length} have different lengths`,
      );
      return false;
    }

    if (ZENDESK_TICKETS_CHANNEL_ID.length === 0) {
      // If there are no channel ids, resolve them by names
      for (const channelName of ZENDESK_TICKETS_CHANNEL_NAME) {
        const channelId: string = await getConversationId(
          slackClient,
          channelName,
        );
        ZENDESK_TICKETS_CHANNEL_ID.push(channelId);
      }
    } else if (
      ZENDESK_TICKETS_CHANNEL_ID.length != ZENDESK_TICKETS_CHANNEL_NAME.length
    ) {
      logger.error(
        "Error: TICKETS_CHANNEL_ID and TICKETS_CHANNEL_NAME have different lengths",
      );
      return false;
    }

    // TODO: This doesn't work for multiple teams
    TEAM_CODE_REVIEW_CHANNEL_ID =
      TEAM_CODE_REVIEW_CHANNEL_ID ||
      (await getConversationId(slackClient, TEAM_CODE_REVIEW_CHANNEL_NAME));

    // TODO: By default report on all teams channels
    GROUP_ASK_CHANNELS_LIST = new Map<string, string>();

    const asksChannels = GROUP_ASK_CHANNELS.split(",");
    asksChannels.forEach((channelDetails: string) => {
      const details = channelDetails.split(":");
      GROUP_ASK_CHANNELS_LIST.set(details[0], details[1]);
    });

    // Load ALLOWED_BOTS per team
    ALLOWED_BOTS_PER_TEAM = new Map<string, string[]>();
    ALLOWED_BOTS.forEach((teamBotConfiguration: string, index) => {
      ALLOWED_BOTS_PER_TEAM.set(
        TEAM_ASK_CHANNEL_ID[index],
        teamBotConfiguration.split(","),
      );
    });

    // Set global slack client to use in cron jobs
    setSlackWebClient(slackClient);

    // TODO: Temporarily, add the current settings to a team JSON
    //  Also, this assumes all arrays are the same length, which is incorrect
    TEAM_ASK_CHANNEL_ID.forEach((channelId, index) => {
      const team = {
        ask_channel_id: channelId,
        ask_channel_name: TEAM_ASK_CHANNEL_NAME[index],
        ask_channel_cron: ASK_CHANNEL_STATS_CRON[index],
        allowed_bots: ALLOWED_BOTS_PER_TEAM.get(channelId) || [],
        zendesk_channel_id: ZENDESK_TICKETS_CHANNEL_ID[index],
        zendesk_channel_name: ZENDESK_TICKETS_CHANNEL_NAME[index],
        zendesk_monitored_view_id: ZENDESK_MONITORED_VIEW[index],
        zendesk_aggregated_field_id: ZENDESK_VIEW_AGGREGATED_FIELD_ID[index],
        zendesk_field_id: MONITORED_ZENDESK_FILTER_FIELD_ID[index] || "",
        zendesk_field_values: Array.from(getArrayValue(MONITORED_ZENDESK_FILTER_FIELD_VALUES, index, '')),
        zendesk_channel_cron: ZENDESK_TICKETS_STATS_CRON[index],
        ask_channel_cron_last_sent: new Date(new Date().setDate(new Date().getDate() - 1)), // Initialize date and time which is exactly one day before the current date and time.
      };

      TEAMS_LIST.set(channelId, team);
    });

    // Load teams JSON list
    logger.debug(`LOADING TEAM LIST ${JSON.stringify(TEAMS_JSON_LIST)}`);
    TEAMS_JSON_LIST.forEach((team_json: string) => {
      try {
        const team_object: any = JSON.parse(team_json);

        if (isTeam(team_object)) {
          console.log(`Adding team from JSON list ${team_json}`);
          TEAMS_LIST.set(team_object.ask_channel_id, team_object);
        } else {
          console.log(`Invalid team JSON ${team_json}`);
        }
      } catch (err) {
        console.log(`Error while parsing team JSON ${team_json}`, err);
      }
    });

    // TODO: Initialize consts from the teams list
    logger.info(
      `Loaded ${TEAMS_LIST.size} teams: ${JSON.stringify([...TEAMS_LIST.values()])}`,
    );

    logger.info("Slack config completed successfully.");
  } catch (err) {
    logger.error("Error while loading Slack Dynamic vars!", err);
    return false;
  }

  return true;
};

// TODO: Move this to a different file? (This is not a team const)
// These will be resolved by the loadConfig function
export let BOT_SLACK_ID: string;
export const setBotSlackId = (botId: string) => {
  BOT_SLACK_ID = botId;
};