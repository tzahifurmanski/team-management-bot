// src/actions/asks/team_admin.ts
import { BotAction } from "../base_action.js";
import { logger } from "../../settings/server_consts.js";
import { sendSlackMessage } from "../../integrations/slack/messages.js";
import { sanitizeCommandInput } from "../../integrations/slack/utils.js";
import { adminAuthService } from "../../services/AdminAuthorizationService.js";
import { TEAMS_LIST } from "../../settings/team_consts.js";

export class TeamAdmin implements BotAction {
  getHelpText(): string {
    return "`team admin` - Admin commands for managing teams (restricted to authorized admins)";
  }

  isEnabled(): boolean {
    return true; // Always available, but authorization is checked in performAction
  }

  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith("team ");
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    const command = sanitizeCommandInput(event.text);

    if (!adminAuthService.isAuthorized(event.user, command)) {
      await sendSlackMessage(
        slackClient,
        "Sorry, you're not authorized to perform admin commands. Please contact a bot administrator if you need assistance.",
        event.channel,
        event.thread_ts,
      );
      return;
    }

    // Parse command parts
    const parts = command.split(" ");

    // Handle different commands
    if (parts.length > 1 && parts[0] === "team") {
      const subCommand = parts[1];

      switch (subCommand) {
        case "list":
          await this.listTeams(event, slackClient);
          break;
        case "help":
        default:
          await this.showHelp(event, slackClient);
          break;
      }
    } else {
      await this.showHelp(event, slackClient);
    }
  }
  /**
   * Optimized team listing method for handling large numbers of teams reliably
   */
  private async listTeams(event: any, slackClient: any): Promise<void> {
    try {
      if (TEAMS_LIST.size === 0) {
        await sendSlackMessage(
          slackClient,
          "No teams are currently configured.",
          event.channel,
          event.thread_ts,
        );
        return;
      }

      // Convert teams to array for processing
      const teamsArray = Array.from(TEAMS_LIST.entries()).map(
        ([, team]) => team,
      );
      // Create summary message
      const summaryMessage = this.createSummaryMessage(teamsArray);
      await sendSlackMessage(
        slackClient,
        summaryMessage,
        event.channel,
        event.thread_ts,
      );

      // Create detailed team listings - split into multiple messages to avoid formatting issues
      // Format: 5 teams per message
      const teamChunks = this.chunkArray(teamsArray, 5);

      for (const chunk of teamChunks) {
        const detailMessage = this.createDetailedTeamMessage(
          chunk,
          teamsArray.indexOf(chunk[0]),
        );
        await sendSlackMessage(
          slackClient,
          detailMessage,
          event.channel,
          event.thread_ts,
        );
      }
    } catch (error) {
      logger.error("Error listing teams:", error);
      await sendSlackMessage(
        slackClient,
        "An error occurred while listing teams. Please check the logs for details.",
        event.channel,
        event.thread_ts,
      );
    }
  }

  /**
   * Create a summary table of all teams
   */
  private createSummaryMessage(teams: any[]): string {
    let message = `*Team Configuration Summary*\n`;
    message += `Total Teams: *${teams.length}* | `;
    message += `With Zendesk: *${teams.filter((team) => team.zendesk_channel_id).length}* | `;
    message += `With Cron Schedule: *${teams.filter((team) => team.ask_channel_cron).length}* | `;
    message += `With Code Review: *${teams.filter((team) => team.code_review_channel_id).length}*\n\n`;

    // Create a markdown table with key information
    message += "| # | Team Name | Ask Channel | Schedule |\n";
    message += "|---|-----------|-------------|----------|\n";

    teams.forEach((team, index) => {
      const rowNumber = index + 1;
      const askChannel = `<#${team.ask_channel_id}|${team.ask_channel_name}>`;
      const cronSchedule = team.ask_channel_cron || "—";

      message += `| ${rowNumber} | ${team.ask_channel_name} | ${askChannel} | \`${cronSchedule}\` |\n`;
    });

    message += "\n_Detailed information follows in separate messages_";
    return message;
  }

  /**
   * Create a detailed message for a chunk of teams
   */
  private createDetailedTeamMessage(
    teamChunk: any[],
    startIndex: number,
  ): string {
    let message = `*Detailed Team Information (${startIndex + 1}-${startIndex + teamChunk.length})*\n\n`;

    teamChunk.forEach((team, chunkIndex) => {
      const globalIndex = startIndex + chunkIndex;
      const teamNumber = globalIndex + 1;

      // Add the team header with proper bold formatting
      message += `*Team #${teamNumber}: ${team.ask_channel_name}*\n`;

      // Create a formatted text block with indentation instead of a code block
      message += `• Ask Channel: <#${team.ask_channel_id}|${team.ask_channel_name}>\n`;
      message += `• Allowed Bots: ${team.allowed_bots && team.allowed_bots.length > 0 && team.allowed_bots[0] !== "" ? team.allowed_bots.join(", ") : "None"}\n`;
      message += `• Last Status: ${new Date(team.ask_channel_cron_last_sent).toISOString().split("T")[0]}\n`;

      // Zendesk info
      if (team.zendesk_channel_id) {
        message += `• Zendesk Channel: <#${team.zendesk_channel_id}|${team.zendesk_channel_name}>\n`;
      }

      if (team.zendesk_monitored_view_id) {
        message += `• Zendesk View ID: ${team.zendesk_monitored_view_id}\n`;
      }

      // Schedules
      if (team.ask_channel_cron) {
        message += `• Ask Schedule: \`${team.ask_channel_cron}\`\n`;
      }

      if (team.zendesk_channel_cron) {
        message += `• Zendesk Schedule: \`${team.zendesk_channel_cron}\`\n`;
      }

      // Add a separator between teams (except after the last one)
      if (chunkIndex < teamChunk.length - 1) {
        message += "\n———————————————————————————\n\n";
      }
    });

    return message;
  }

  /**
   * Split an array into chunks of specified size
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Display help information
   */
  private async showHelp(event: any, slackClient: any): Promise<void> {
    const helpText = `
*Team Administration Commands*

• \`team list\` - List all configured teams
    `;

    await sendSlackMessage(
      slackClient,
      helpText,
      event.channel,
      event.thread_ts,
    );
  }
}
