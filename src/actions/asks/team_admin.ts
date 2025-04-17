// src/actions/asks/team_admin.ts
import { BotAction } from "../base_action";
import { logger } from "../../settings/server_consts";
import { sendSlackMessage } from "../../integrations/slack/messages";
import { sanitizeCommandInput } from "../../integrations/slack/utils";
import { adminAuthService } from "../../services/AdminAuthorizationService";
import { TEAMS_LIST } from "../../settings/team_consts";
import {
  extractIDFromChannelString,
  extractNameFromChannelString,
} from "../utils";
import { TeamService } from "../../services/TeamService";

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
        event.thread_ts
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
        case "add":
          await this.addTeam(parts.slice(2), event, slackClient);
          break;
        case "edit":
          await this.editTeam(parts.slice(2), event, slackClient);
          break;
        case "delete":
          await this.deleteTeam(parts.slice(2), event, slackClient);
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
          event.thread_ts
        );
        return;
      }

      // Convert teams to array for processing
      const teamsArray = Array.from(TEAMS_LIST.entries()).map(
        ([channelId, team]) => team
      );

      // Create summary message
      const summaryMessage = this.createSummaryMessage(teamsArray);
      await sendSlackMessage(
        slackClient,
        summaryMessage,
        event.channel,
        event.thread_ts
      );

      // Create detailed team listings - split into multiple messages to avoid formatting issues
      // Format: 5 teams per message
      const teamChunks = this.chunkArray(teamsArray, 5);

      for (const chunk of teamChunks) {
        const detailMessage = this.createDetailedTeamMessage(
          chunk,
          teamsArray.indexOf(chunk[0])
        );
        await sendSlackMessage(
          slackClient,
          detailMessage,
          event.channel,
          event.thread_ts
        );
      }
    } catch (error) {
      logger.error("Error listing teams:", error);
      await sendSlackMessage(
        slackClient,
        "An error occurred while listing teams. Please check the logs for details.",
        event.channel,
        event.thread_ts
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
    startIndex: number
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

  private async addTeam(
    args: string[],
    event: any,
    slackClient: any
  ): Promise<void> {
    try {
      // Basic validation
      if (args.length < 1) {
        await sendSlackMessage(
          slackClient,
          "Please provide channel information: `team add #channel-name [cron schedule]`",
          event.channel,
          event.thread_ts
        );
        return;
      }

      // Extract channel information
      const channelRef = args[0];
      const channelId = extractIDFromChannelString(channelRef);
      const channelName = extractNameFromChannelString(channelRef);

      if (!channelId || !channelName) {
        await sendSlackMessage(
          slackClient,
          "Please provide a valid Slack channel: `team add #channel-name`",
          event.channel,
          event.thread_ts
        );
        return;
      }

      // Check if team already exists
      if (TEAMS_LIST.has(channelId)) {
        await sendSlackMessage(
          slackClient,
          `A team with channel ID <#${channelId}> already exists. Unable to add a new team for <#${channelId}|${channelName}>.`,
          event.channel,
          event.thread_ts
        );
        return;
      }

      // Create new team with basic configuration
      const cronSchedule = args.length > 1 ? args[1] : "";

      const newTeam = {
        ask_channel_id: channelId,
        ask_channel_name: channelName,
        ask_channel_cron: cronSchedule,
        ask_channel_cron_last_sent: null,
        allowed_bots: [],
        zendesk_channel_id: "",
        zendesk_channel_name: "",
        zendesk_monitored_view_id: "",
        zendesk_aggregated_field_id: "",
        zendesk_field_id: "",
        zendesk_field_values: [],
        zendesk_channel_cron: "",
        code_review_channel_id: "",
        code_review_channel_name: "",
      };

      // Save to database using service
      const success = await TeamService.createTeam(newTeam);

      if (success) {
        // Add to in-memory map
        TEAMS_LIST.set(channelId, newTeam);

        await sendSlackMessage(
          slackClient,
          `Successfully added team for channel <#${channelId}|${channelName}>\n` +
            `Cron Schedule: ${cronSchedule || "Not set"}`,
          event.channel,
          event.thread_ts
        );
      } else {
        await sendSlackMessage(
          slackClient,
          `Failed to add team for channel <#${channelId}|${channelName}>. Please check logs.`,
          event.channel,
          event.thread_ts
        );
      }
    } catch (error) {
      logger.error("Error adding team:", error);
      await sendSlackMessage(
        slackClient,
        "An error occurred while adding the team. Please check logs for details.",
        event.channel,
        event.thread_ts
      );
    }
  }

  private async editTeam(
    args: string[],
    event: any,
    slackClient: any
  ): Promise<void> {
    try {
      // Basic validation
      if (args.length < 3) {
        await sendSlackMessage(
          slackClient,
          "Please provide: `team edit #channel-name property value`",
          event.channel,
          event.thread_ts
        );
        return;
      }

      // Extract channel information
      const channelRef = args[0];
      const channelId = extractIDFromChannelString(channelRef);

      if (!channelId) {
        await sendSlackMessage(
          slackClient,
          "Please provide a valid Slack channel: `team edit #channel-name`",
          event.channel,
          event.thread_ts
        );
        return;
      }

      // Check if team exists
      const team = TEAMS_LIST.get(channelId);
      if (!team) {
        await sendSlackMessage(
          slackClient,
          `No team found for channel <#${channelId}>.`,
          event.channel,
          event.thread_ts
        );
        return;
      }

      // Get property and value
      const property = args[1];
      const value = args.slice(2).join(" ");

      // Validate property
      if (!(property in team)) {
        await sendSlackMessage(
          slackClient,
          `Invalid property "${property}". Valid properties are: ${Object.keys(team).join(", ")}`,
          event.channel,
          event.thread_ts
        );
        return;
      }

      // Create update data object
      const updateData: any = {};

      // Handle special cases for array properties
      if (property === "allowed_bots" || property === "zendesk_field_values") {
        updateData[property] = value
          .split(",")
          .map((item: string) => item.trim());
      } else {
        updateData[property] = value;
      }

      // Handle ask_channel_id update
      let oldChannelId = channelId;
      if (property === "ask_channel_id" || property === "ask_channel_name") {
        const newChannelId = extractIDFromChannelString(value);
        if (!newChannelId) {
          await sendSlackMessage(
            slackClient,
            "Please provide a valid Slack channel for the new ask_channel_id: `team edit #channel-name ask_channel_id #new-channel-name`",
            event.channel,
            event.thread_ts
          );
          return;
        }
        const newChannelName = extractNameFromChannelString(value);
        oldChannelId = channelId;
        updateData["ask_channel_id"] = newChannelId;
        updateData["ask_channel_name"] = newChannelName;
      }

      // Save to database using service
      const success = await TeamService.updateTeam(channelId, updateData);

      if (success) {
        // Update in-memory map - using type assertion to avoid TS errors
        const teamAny = team as any;

        // Handle ask_channel_id update in TEAMS_LIST
        if (property === "ask_channel_id" || property === "ask_channel_name") {
          TEAMS_LIST.delete(oldChannelId);
          teamAny.ask_channel_id = updateData.ask_channel_id;
          teamAny.ask_channel_name = updateData.ask_channel_name;
          TEAMS_LIST.set(updateData.ask_channel_id, team);
        } else {
          teamAny[property] = updateData[property];
        }

        await sendSlackMessage(
          slackClient,
          `Successfully updated team for channel <#${channelId}|${team.ask_channel_name}>\n` +
            `Updated property: ${property}\n` +
            `New value: ${value}`,
          event.channel,
          event.thread_ts
        );
      } else {
        await sendSlackMessage(
          slackClient,
          `Failed to update team for channel <#${channelId}|${team.ask_channel_name}>. Please check logs.`,
          event.channel,
          event.thread_ts
        );
      }
    } catch (error) {
      logger.error("Error updating team:", error);
      await sendSlackMessage(
        slackClient,
        "An error occurred while updating the team. Please check logs for details.",
        event.channel,
        event.thread_ts
      );
    }
  }

  private async deleteTeam(
    args: string[],
    event: any,
    slackClient: any
  ): Promise<void> {
    try {
      // Basic validation
      if (args.length < 1) {
        await sendSlackMessage(
          slackClient,
          "Please provide a channel: `team delete #channel-name`",
          event.channel,
          event.thread_ts
        );
        return;
      }

      // Extract channel information
      const channelRef = args[0];
      const channelId = extractIDFromChannelString(channelRef);

      if (!channelId) {
        await sendSlackMessage(
          slackClient,
          "Please provide a valid Slack channel: `team delete #channel-name`",
          event.channel,
          event.thread_ts
        );
        return;
      }

      // Check if team exists
      const team = TEAMS_LIST.get(channelId);
      if (!team) {
        await sendSlackMessage(
          slackClient,
          `No team found for channel <#${channelId}>.`,
          event.channel,
          event.thread_ts
        );
        return;
      }

      // Delete from database
      const success = await TeamService.deleteTeam(channelId);

      if (success) {
        // Remove from in-memory map
        TEAMS_LIST.delete(channelId);

        await sendSlackMessage(
          slackClient,
          `Successfully deleted team for channel <#${channelId}|${team.ask_channel_name}>`,
          event.channel,
          event.thread_ts
        );
      } else {
        await sendSlackMessage(
          slackClient,
          `Failed to delete team for channel <#${channelId}|${team.ask_channel_name}>. Please check logs.`,
          event.channel,
          event.thread_ts
        );
      }
    } catch (error) {
      logger.error("Error deleting team:", error);
      await sendSlackMessage(
        slackClient,
        "An error occurred while deleting the team. Please check logs for details.",
        event.channel,
        event.thread_ts
      );
    }
  }

  private async showHelp(event: any, slackClient: any): Promise<void> {
    const helpText = `
*Team Administration Commands*

- \`team list\` - List all configured teams
- \`team add #channel-name [cron schedule]\` - Add a new team for a channel
- \`team edit #channel-name property value\` - Edit a team property
- \`team delete #channel-name\` - Delete a team
- \`team help\` - Show this help message
    `;

    await sendSlackMessage(
      slackClient,
      helpText,
      event.channel,
      event.thread_ts
    );
  }
}
