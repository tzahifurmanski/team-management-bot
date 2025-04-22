// TODO: Make sure to load server_consts.ts before loading this - Instead, maybe load the dotenv conf?

import {
  getBotId,
  getConversationId,
} from "../integrations/slack/conversations.js";
import { BOT_SLACK_ID, logger, setBotSlackId } from "./server_consts.js";
import { handleListParameter } from "../utils.js";
import { setSlackWebClient } from "../integrations/consts.js";
import { isTeam } from "./team_utils.js";
import { TeamService } from "../services/TeamService.js";

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
  ask_channel_cron_last_sent: Date | null; // Keep track of the last time a scheduled message was sent

  // Zendesk Integration
  zendesk_channel_id: string;
  zendesk_channel_name: string;
  zendesk_monitored_view_id: string;
  zendesk_aggregated_field_id: string;
  zendesk_field_id: string;
  zendesk_field_values: string[];
  zendesk_channel_cron: string;

  // Reactions
  code_review_channel_id: string;
  code_review_channel_name: string;
}

// A teams list with the ask channel id as the key
export const TEAMS_LIST = new Map<string, Team>();

export const getTeamsList = (): Map<string, Team> => {
  return TEAMS_LIST;
};

// TODO: Move this
// User profile field ids
export const USER_PROFILE_FIELD_ID_TEAM =
  process.env.USER_PROFILE_FIELD_ID_TEAM || "";
export const USER_PROFILE_FIELD_ID_DEPARTMENT =
  process.env.USER_PROFILE_FIELD_ID_DEPARTMENT || "";
export const USER_PROFILE_FIELD_ID_DIVISION =
  process.env.USER_PROFILE_FIELD_ID_DIVISION || "";

// Responses
// ==========

// TODO: This is broken!, nothing uses the parameter!
const _GROUP_ASK_CHANNELS: string = process.env.GROUP_ASK_CHANNELS || "";
export const GROUP_ASK_CHANNELS_LIST = new Map<string, string>();

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

// Separated legacy environment variable loading function
export const loadTeamsFromEnv = async (
  slackClient: any,
): Promise<Map<string, Team>> => {
  logger.info("Loading teams from environment variables...");
  // logger.trace(JSON.stringify(process.env, null, 2));

  const envTeams = new Map<string, Team>();

  try {
    // Original environment variable loading logic
    const TEAM_ASK_CHANNEL_ID: string[] = handleListParameter(
      process.env.TEAM_ASK_CHANNEL_ID,
    );
    const TEAM_ASK_CHANNEL_NAME: string[] = handleListParameter(
      process.env.TEAM_ASK_CHANNEL_NAME,
    );
    const TEAM_CODE_REVIEW_CHANNEL_ID: string[] = handleListParameter(
      process.env.TEAM_CODE_REVIEW_CHANNEL_ID,
      "",
      ",",
      false,
    );

    const TEAM_CODE_REVIEW_CHANNEL_NAME: string[] = handleListParameter(
      process.env.TEAM_CODE_REVIEW_CHANNEL_NAME,
      "",
      ",",
      false,
    );

    logger.debug("Handling ALLOWED_BOTS");
    const ALLOWED_BOTS: string[] = handleListParameter(
      process.env.ALLOWED_BOTS,
      "",
      "|",
      false,
    );

    logger.debug("DONE Handling ALLOWED_BOTS");
    // Zendesk Tickets Status Configurations
    const ZENDESK_MONITORED_VIEW = handleListParameter(
      process.env.ZENDESK_MONITORED_VIEW,
    );

    const MONITORED_ZENDESK_FILTER_FIELD_ID = handleListParameter(
      process.env.MONITORED_ZENDESK_FILTER_FIELD_ID,
      "",
      ",",
      false,
    );

    const MONITORED_ZENDESK_FILTER_FIELD_VALUES: string[] = handleListParameter(
      process.env.MONITORED_ZENDESK_FILTER_FIELD_VALUES,
      "",
      "|",
      false,
    );

    const ZENDESK_VIEW_AGGREGATED_FIELD_ID = handleListParameter(
      process.env.ZENDESK_VIEW_AGGREGATED_FIELD_ID,
      "",
      ",",
      false,
    );

    const ZENDESK_TICKETS_CHANNEL_ID: string[] = handleListParameter(
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
      return envTeams;
    } else if (TEAM_ASK_CHANNEL_ID.length != ALLOWED_BOTS.length) {
      // Each channel (ID) needs to have a bots definition
      logger.error(
        `Error: TEAM_ASK_CHANNEL_ID ${TEAM_ASK_CHANNEL_ID.length} and ALLOWED_BOTS ${ALLOWED_BOTS.length} have different lengths`,
      );
      return envTeams;
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
      return envTeams;
    }

    if (TEAM_CODE_REVIEW_CHANNEL_ID.length === 0) {
      // If there are no channel ids, resolve them by names
      for (const channelName of TEAM_CODE_REVIEW_CHANNEL_NAME) {
        const channelId: string = await getConversationId(
          slackClient,
          channelName,
        );
        TEAM_CODE_REVIEW_CHANNEL_ID.push(channelId);
      }
    } else if (
      TEAM_CODE_REVIEW_CHANNEL_ID.length !==
      TEAM_CODE_REVIEW_CHANNEL_NAME.length
    ) {
      logger.error(
        "Error: TEAM_CODE_REVIEW_CHANNEL_ID and TEAM_CODE_REVIEW_CHANNEL_NAME have different lengths",
      );
      return envTeams;
    }

    // Load ALLOWED_BOTS per team
    const ALLOWED_BOTS_PER_TEAM = new Map<string, string[]>();
    ALLOWED_BOTS.forEach((teamBotConfiguration: string, index) => {
      ALLOWED_BOTS_PER_TEAM.set(
        TEAM_ASK_CHANNEL_ID[index],
        teamBotConfiguration.split(","),
      );
    });

    // Cron
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

    TEAM_ASK_CHANNEL_ID.forEach((channelId, index) => {
      const team: Team = {
        ask_channel_id: channelId,
        ask_channel_name: TEAM_ASK_CHANNEL_NAME[index],
        ask_channel_cron: ASK_CHANNEL_STATS_CRON[index],
        allowed_bots: ALLOWED_BOTS_PER_TEAM.get(channelId) || [],
        zendesk_channel_id: ZENDESK_TICKETS_CHANNEL_ID[index],
        zendesk_channel_name: ZENDESK_TICKETS_CHANNEL_NAME[index],
        zendesk_monitored_view_id: ZENDESK_MONITORED_VIEW[index],
        zendesk_aggregated_field_id: ZENDESK_VIEW_AGGREGATED_FIELD_ID[index],
        zendesk_field_id: MONITORED_ZENDESK_FILTER_FIELD_ID[index] || "",
        zendesk_field_values: (MONITORED_ZENDESK_FILTER_FIELD_VALUES.length >
        index
          ? MONITORED_ZENDESK_FILTER_FIELD_VALUES[index]
          : ""
        ).split(","),
        zendesk_channel_cron: ZENDESK_TICKETS_STATS_CRON[index],
        ask_channel_cron_last_sent: new Date(
          new Date().setDate(new Date().getDate() - 1),
        ), // Initialize date and time which is exactly one day before the current date and time.

        code_review_channel_id: TEAM_CODE_REVIEW_CHANNEL_ID[index] || "",
        code_review_channel_name: TEAM_CODE_REVIEW_CHANNEL_NAME[index] || "",
      };

      envTeams.set(channelId, team);
    });

    // Load teams JSON list
    const TEAMS_JSON_LIST: string[] = handleListParameter(
      process.env.TEAMS_JSON_LIST,
      "",
      "|",
    );

    logger.debug(`LOADING TEAM LIST ${JSON.stringify(TEAMS_JSON_LIST)}`);
    TEAMS_JSON_LIST.forEach((team_json: string) => {
      try {
        const team_object: any = JSON.parse(team_json);

        if (isTeam(team_object)) {
          logger.info(`Adding team from JSON list ${team_json}`);
          envTeams.set(team_object.ask_channel_id, team_object);
        } else {
          logger.info(`Invalid team JSON ${team_json}`);
        }
      } catch (err) {
        logger.error(`Error while parsing team JSON ${team_json}`, err);
      }
    });

    logger.info(`Loaded ${envTeams.size} teams from environment variables`);
  } catch (err) {
    logger.error("Error while loading teams from environment variables:", err);
  }

  return envTeams;
};

// Update loadConfig to use database first, then environment
export const loadConfig = async (slackClient: any) => {
  logger.info("Starting Slack config load...");
  try {
    // Load bot ID
    const botSlackID = await getBotId(slackClient);
    setBotSlackId(botSlackID);
    logger.info(`Loaded bot id ${BOT_SLACK_ID}`);

    // Set global slack client to use in cron jobs
    setSlackWebClient(slackClient);

    // Clear the current map
    TEAMS_LIST.clear();

    // First, try to load teams from database
    const dbTeams = await TeamService.loadAllTeams();
    logger.info(`Loaded ${dbTeams.size} teams from database`);

    // Add all DB teams to TEAMS_LIST
    for (const [channelId, team] of dbTeams.entries()) {
      TEAMS_LIST.set(channelId, team);
    }

    // Next, load teams from environment variables (if enabled)
    if (process.env.ENABLE_ENV_TEAMS === "true") {
      const envTeams = await loadTeamsFromEnv(slackClient);

      // Merge environment teams with DB teams (environment overrides DB)
      for (const [channelId, envTeam] of envTeams.entries()) {
        if (TEAMS_LIST.has(channelId)) {
          logger.info(
            `Team for channel ${channelId} exists in DB, overriding with environment config`,
          );
        }
        TEAMS_LIST.set(channelId, envTeam);

        // Also save/update this team in the database
        if (dbTeams.has(channelId)) {
          // Update existing team
          await TeamService.updateTeam(channelId, envTeam);
        } else {
          // Create new team
          await TeamService.createTeam(envTeam);
        }
      }
    }

    logger.info(`Final team count: ${TEAMS_LIST.size} teams`);
    logger.info("Slack config completed successfully.");
  } catch (err) {
    logger.error(
      "Error while loading Slack config or connecting to database:",
      err,
    );
    return false;
  }

  return true;
};
