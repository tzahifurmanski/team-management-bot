// src/services/MigrationService.ts
import { AppDataSource } from "../database/connection.js";
import { Team } from "../entities/Team.js";
import { AskChannel } from "../entities/AskChannel.js";
import { ZendeskIntegration } from "../entities/ZendeskIntegration.js";
import { CodeReviewChannel } from "../entities/CodeReviewChannel.js";
import { TEAMS_LIST } from "../settings/team_consts.js";
import { logger } from "../settings/server_consts.js";

export async function migrateTeamsToDatabase(): Promise<boolean> {
  try {
    logger.info("Starting migration of teams to database...");

    const teamRepository = AppDataSource.getRepository(Team);

    // Get the teams from TEAMS_LIST
    const legacyTeams = Array.from(TEAMS_LIST.values());

    logger.info(`Found ${legacyTeams.length} teams to migrate`);

    // For tracking migration progress
    let migratedCount = 0;

    for (const legacyTeam of legacyTeams) {
      try {
        // Check if a team with this ask_channel_id already exists to prevent duplicates
        const askChannelRepository = AppDataSource.getRepository(AskChannel);
        const existingAskChannel = await askChannelRepository.findOne({
          where: { channel_id: legacyTeam.ask_channel_id },
        });

        if (existingAskChannel) {
          logger.info(
            `Team with ask_channel_id ${legacyTeam.ask_channel_id} already exists in database, skipping`,
          );
          continue;
        }

        // Create Team entity
        const team = new Team();
        team.name = legacyTeam.ask_channel_name;
        team.description = `Team migrated from legacy configuration`;

        // Create AskChannel entity
        const askChannel = new AskChannel();
        askChannel.channel_id = legacyTeam.ask_channel_id;
        askChannel.channel_name = legacyTeam.ask_channel_name;
        askChannel.cron_schedule = legacyTeam.ask_channel_cron;
        askChannel.cron_last_sent = legacyTeam.ask_channel_cron_last_sent;
        askChannel.allowed_bots = legacyTeam.allowed_bots || [];

        // Associate AskChannel with Team
        askChannel.team = team;
        team.askChannel = askChannel;

        // Create ZendeskIntegration entity if relevant
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

          // Associate ZendeskIntegration with Team
          zendeskIntegration.team = team;
          team.zendeskIntegration = zendeskIntegration;
        }

        // Create CodeReviewChannel entity if relevant
        if (legacyTeam.code_review_channel_id) {
          const codeReviewChannel = new CodeReviewChannel();
          codeReviewChannel.channel_id = legacyTeam.code_review_channel_id;
          codeReviewChannel.channel_name = legacyTeam.code_review_channel_name;

          // Associate CodeReviewChannel with Team
          codeReviewChannel.team = team;
          team.codeReviewChannel = codeReviewChannel;
        }

        // Save the complete team with all relations
        await teamRepository.save(team);

        migratedCount++;
        logger.info(`Successfully migrated team ${team.name} to database`);
      } catch (error) {
        logger.error(
          `Error migrating team ${legacyTeam.ask_channel_name}:`,
          error,
        );
      }
    }

    logger.info(
      `Migration complete. Successfully migrated ${migratedCount} of ${legacyTeams.length} teams`,
    );
    return true;
  } catch (error) {
    logger.error("Failed to migrate teams to database:", error);
    return false;
  }
}
