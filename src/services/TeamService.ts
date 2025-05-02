// src/services/TeamService.ts
import { AppDataSource } from "../database/connection.js";
import { Team } from "../entities/Team.js";
import { AskChannel } from "../entities/AskChannel.js";
import { ZendeskIntegration } from "../entities/ZendeskIntegration.js";
import { CodeReviewChannel } from "../entities/CodeReviewChannel.js";
import { logger } from "../settings/server_consts.js";
import { Team as LegacyTeam, TEAMS_LIST } from "../settings/team_consts.js";

export class TeamService {
  /**
   * Load all teams and convert them to the legacy format
   */
  public static async loadAllTeams(): Promise<Map<string, LegacyTeam>> {
    try {
      const teamRepository = AppDataSource.getRepository(Team);
      const teams = await teamRepository.find({
        relations: ["askChannel", "zendeskIntegration", "codeReviewChannel"],
      });

      const teamsMap = new Map<string, LegacyTeam>();

      teams.forEach((team) => {
        if (team.askChannel) {
          const legacyTeam: LegacyTeam = {
            ask_channel_id: team.askChannel.channel_id,
            ask_channel_name: team.askChannel.channel_name,
            ask_channel_cron: team.askChannel.cron_schedule || "",
            ask_channel_cron_last_sent: team.askChannel.cron_last_sent,
            allowed_bots: team.askChannel.allowed_bots || [],

            // ZendeskIntegration properties
            zendesk_channel_id: team.zendeskIntegration?.channel_id || "",
            zendesk_channel_name: team.zendeskIntegration?.channel_name || "",
            zendesk_monitored_view_id:
              team.zendeskIntegration?.monitored_view_id || "",
            zendesk_aggregated_field_id:
              team.zendeskIntegration?.aggregated_field_id || "",
            zendesk_field_id: team.zendeskIntegration?.field_id || "",
            zendesk_field_values: team.zendeskIntegration?.field_values || [],
            zendesk_channel_cron: team.zendeskIntegration?.cron_schedule || "",

            // CodeReviewChannel properties
            code_review_channel_id: team.codeReviewChannel?.channel_id || "",
            code_review_channel_name:
              team.codeReviewChannel?.channel_name || "",
          };

          teamsMap.set(legacyTeam.ask_channel_id, legacyTeam);
        }
      });

      logger.info(`Loaded ${teamsMap.size} teams from database`);
      return teamsMap;
    } catch (error) {
      logger.error("Failed to load teams from database:", error);
      return new Map<string, LegacyTeam>();
    }
  }

  /**
   * Create a new team with all related entities
   */
  public static async createTeam(legacyTeam: LegacyTeam): Promise<boolean> {
    try {
      const teamRepository = AppDataSource.getRepository(Team);

      // Check if team with this ask_channel_id already exists
      const askChannelRepository = AppDataSource.getRepository(AskChannel);
      const existingAskChannel = await askChannelRepository.findOne({
        where: { channel_id: legacyTeam.ask_channel_id },
        relations: ["team"],
      });

      if (existingAskChannel) {
        logger.info(
          `Team for channel ${legacyTeam.ask_channel_id} already exists, using update instead`,
        );
        return await TeamService.updateTeam(
          legacyTeam.ask_channel_id,
          legacyTeam,
        );
      }

      // Create main team entity
      const team = new Team();
      team.name = legacyTeam.ask_channel_name;

      // Create and associate AskChannel
      const askChannel = new AskChannel();
      askChannel.channel_id = legacyTeam.ask_channel_id;
      askChannel.channel_name = legacyTeam.ask_channel_name;
      askChannel.cron_schedule = legacyTeam.ask_channel_cron;
      askChannel.cron_last_sent = legacyTeam.ask_channel_cron_last_sent;
      askChannel.allowed_bots = legacyTeam.allowed_bots;
      askChannel.team = team;
      team.askChannel = askChannel;

      // Create ZendeskIntegration if needed
      if (legacyTeam.zendesk_channel_id) {
        const zendeskIntegration = new ZendeskIntegration();
        zendeskIntegration.channel_id = legacyTeam.zendesk_channel_id;
        zendeskIntegration.channel_name = legacyTeam.zendesk_channel_name;
        zendeskIntegration.monitored_view_id =
          legacyTeam.zendesk_monitored_view_id;
        zendeskIntegration.aggregated_field_id =
          legacyTeam.zendesk_aggregated_field_id;
        zendeskIntegration.field_id = legacyTeam.zendesk_field_id;
        zendeskIntegration.field_values = legacyTeam.zendesk_field_values;
        zendeskIntegration.cron_schedule = legacyTeam.zendesk_channel_cron;
        zendeskIntegration.team = team;
        team.zendeskIntegration = zendeskIntegration;
      }

      // Create CodeReviewChannel if needed
      if (legacyTeam.code_review_channel_id) {
        const codeReviewChannel = new CodeReviewChannel();
        codeReviewChannel.channel_id = legacyTeam.code_review_channel_id;
        codeReviewChannel.channel_name = legacyTeam.code_review_channel_name;
        codeReviewChannel.team = team;
        team.codeReviewChannel = codeReviewChannel;
      }

      // Save team and all related entities using cascade
      await teamRepository.save(team);

      logger.info(`Created team ${team.name} in database`);
      return true;
    } catch (error) {
      logger.error("Failed to create team in database:", error);
      return false;
    }
  }

  /**
   * Update an existing team
   */
  public static async updateTeam(
    channelId: string,
    updates: Partial<LegacyTeam>,
  ): Promise<boolean> {
    try {
      // First find the team by ask_channel_id
      const askChannelRepository = AppDataSource.getRepository(AskChannel);
      const askChannel = await askChannelRepository.findOne({
        where: { channel_id: channelId },
        relations: [
          "team",
          "team.zendeskIntegration",
          "team.codeReviewChannel",
        ],
      });

      if (!askChannel) {
        logger.error(`No team found with ask_channel_id ${channelId}`);
        return false;
      }

      const team = askChannel.team;

      // Get previous team details
      const previousTeam = TEAMS_LIST.get(channelId);
      if (!previousTeam) {
        logger.error(
          `No team found in TEAMS_LIST with ask_channel_id ${channelId}`,
        );
        return false;
      }

      // Update ask channel properties
      if (updates.ask_channel_id !== undefined) {
        // Update the ask channel properties
        askChannel.channel_id = updates.ask_channel_id;
      }

      if (updates.ask_channel_name) {
        askChannel.channel_name = updates.ask_channel_name;
        team.name = updates.ask_channel_name;
      }

      if (updates.ask_channel_cron !== undefined)
        askChannel.cron_schedule = updates.ask_channel_cron;
      if (updates.ask_channel_cron_last_sent)
        askChannel.cron_last_sent = updates.ask_channel_cron_last_sent;
      if (updates.allowed_bots) askChannel.allowed_bots = updates.allowed_bots;

      // Update zendesk integration
      if (
        updates.zendesk_channel_id ||
        updates.zendesk_channel_name ||
        updates.zendesk_monitored_view_id ||
        updates.zendesk_aggregated_field_id ||
        updates.zendesk_field_id ||
        updates.zendesk_field_values ||
        updates.zendesk_channel_cron
      ) {
        let zendeskIntegration = team.zendeskIntegration;

        // Create if doesn't exist
        if (!zendeskIntegration) {
          zendeskIntegration = new ZendeskIntegration();
          zendeskIntegration.team = team;
          team.zendeskIntegration = zendeskIntegration;
        }

        // Update properties
        if (updates.zendesk_channel_id !== undefined)
          zendeskIntegration.channel_id = updates.zendesk_channel_id;
        if (updates.zendesk_channel_name !== undefined)
          zendeskIntegration.channel_name = updates.zendesk_channel_name;
        if (updates.zendesk_monitored_view_id !== undefined)
          zendeskIntegration.monitored_view_id =
            updates.zendesk_monitored_view_id;
        if (updates.zendesk_aggregated_field_id !== undefined)
          zendeskIntegration.aggregated_field_id =
            updates.zendesk_aggregated_field_id;
        if (updates.zendesk_field_id !== undefined)
          zendeskIntegration.field_id = updates.zendesk_field_id;
        if (updates.zendesk_field_values !== undefined)
          zendeskIntegration.field_values = updates.zendesk_field_values;
        if (updates.zendesk_channel_cron !== undefined)
          zendeskIntegration.cron_schedule = updates.zendesk_channel_cron;
      }

      // Update code review channel
      if (
        updates.code_review_channel_id !== undefined ||
        updates.code_review_channel_name !== undefined
      ) {
        let codeReviewChannel = team.codeReviewChannel;

        if (
          !updates.code_review_channel_id &&
          !updates.code_review_channel_name
        ) {
          // If both ID and name are empty/undefined, remove the code review channel
          if (codeReviewChannel) {
            const codeReviewRepository =
              AppDataSource.getRepository(CodeReviewChannel);
            await codeReviewRepository.remove(codeReviewChannel);
            team.codeReviewChannel = null;
          }
        } else {
          // Create if doesn't exist and we have valid data
          if (
            !codeReviewChannel &&
            (updates.code_review_channel_id || updates.code_review_channel_name)
          ) {
            codeReviewChannel = new CodeReviewChannel();
            codeReviewChannel.team = team;
            team.codeReviewChannel = codeReviewChannel;
          }

          // Update properties only if we have a channel
          if (codeReviewChannel) {
            if (updates.code_review_channel_id !== undefined)
              codeReviewChannel.channel_id = updates.code_review_channel_id;
            if (updates.code_review_channel_name !== undefined)
              codeReviewChannel.channel_name = updates.code_review_channel_name;
          }
        }
      }

      // Save all changes to database first
      const teamRepository = AppDataSource.getRepository(Team);
      await teamRepository.save(team);

      // Only after successful database save, update TEAMS_LIST
      const updatedTeam = { ...previousTeam, ...updates };

      // If ask_channel_id was updated, we need to remove the old entry
      if (updates.ask_channel_id !== undefined) {
        TEAMS_LIST.delete(channelId);
      }

      // Set the new entry with the correct channel ID
      TEAMS_LIST.set(
        updates.ask_channel_id !== undefined
          ? updates.ask_channel_id
          : channelId,
        updatedTeam,
      );

      logger.info(`Updated team with ask_channel_id ${channelId}`);
      return true;
    } catch (error) {
      logger.error(
        `Failed to update team with ask_channel_id ${channelId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Delete a team and all its related entities
   */
  public static async deleteTeam(channelId: string): Promise<boolean> {
    try {
      const askChannelRepository = AppDataSource.getRepository(AskChannel);
      const askChannel = await askChannelRepository.findOne({
        where: { channel_id: channelId },
        relations: ["team"],
      });

      if (!askChannel) {
        logger.error(`No team found with ask_channel_id ${channelId}`);
        return false;
      }

      const teamRepository = AppDataSource.getRepository(Team);
      await teamRepository.remove(askChannel.team);

      logger.info(`Deleted team with ask_channel_id ${channelId}`);
      return true;
    } catch (error) {
      logger.error(
        `Failed to delete team with ask_channel_id ${channelId}:`,
        error,
      );
      return false;
    }
  }
}
