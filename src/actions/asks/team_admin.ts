// src/actions/asks/team_admin.ts
import { BotAction } from "../base_action.js";
import { logger } from "../../settings/server_consts.js";
import { sendSlackMessage } from "../../integrations/slack/messages.js";
import { sanitizeCommandInput } from "../../integrations/slack/utils.js";
import { adminAuthService } from "../../services/AdminAuthorizationService.js";
import { TEAMS_LIST } from "../../settings/team_consts.js";
import {
  extractIDFromChannelString,
  extractNameFromChannelString,
} from "../utils.js";
import { TeamService } from "../../services/TeamService.js";
import { WebClient } from "@slack/web-api";
import { SlackEventType } from "../../integrations/slack/types.js";
import { getConversationName } from "../../integrations/slack/conversations.js";
import { isValidCronExpression } from "../../utils/cron.js";
import * as cronstrue from "cronstrue";

export class TeamAdmin implements BotAction {
  getHelpText(): string {
    // TODO: Only show this if the user is an admin (adminAuthService.isUserAdmin - Requires changing the function signature in all actions)
    return `\`team admin\` - Admin commands for managing teams (restricted to authorized admins)

*Available Commands:*

• \`team list\` - List all configured teams
• \`team list #channel-name\` - Show detailed information for a specific team

• \`team add #channel-name [cron schedule]\` - Add a new team
  - Required: #channel-name - The Slack channel for the team
  - Optional: cron schedule - When to run scheduled asks (e.g. "0 9 * * 1-5" for weekdays at 9 AM GMT)

• \`team edit #channel-name property value\` - Edit team properties
  Properties:
  - \`ask_channel_id\` - Update team's ask channel
  - \`ask_channel_name\` - Update channel name
  - \`ask_channel_cron\` - Update ask schedule (cron format)
  - \`allowed_bots\` - Comma-separated list of allowed bots
  - \`zendesk_channel_id\` - Zendesk notifications channel
  - \`zendesk_monitored_view_id\` - Zendesk view ID to monitor
  - \`zendesk_field_id\` - Zendesk field ID
  - \`zendesk_field_values\` - Comma-separated list of field values
  - \`zendesk_channel_cron\` - Zendesk check schedule (cron format)
  - \`code_review_channel_id\` - Code review notifications channel
  Use "EMPTY" as value to clear a field

• \`team delete #channel-name\` - Delete a team configuration

• \`team help\` - Show this help message`;
  }

  isEnabled(): boolean {
    return true; // Always available, but authorization is checked in performAction
  }

  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith("team ");
  }

  public async performAction(
    event: SlackEventType,
    client: WebClient,
  ): Promise<void> {
    // Get the full command
    const command = sanitizeCommandInput(event.text);

    // Check if user is authorized
    const isUserAuthorized = adminAuthService.isAuthorized(event.user, command);
    if (!isUserAuthorized) {
      await sendSlackMessage(
        client,
        "Sorry, you're not authorized to perform admin commands",
        event.channel,
        event.thread_ts,
      );
      return;
    }

    // Request confirmation
    try {
      await adminAuthService.requestConfirmation(
        event.user,
        event.team,
        "team admin",
      );
    } catch (_error) {
      await sendSlackMessage(
        client,
        "Failed to process your request",
        event.channel,
        event.thread_ts,
      );
      return;
    }

    // Wait for confirmation
    const isConfirmed = await adminAuthService.confirmAction(
      event.user,
      event.team,
      "team admin",
    );
    if (!isConfirmed) {
      await sendSlackMessage(
        client,
        "Action was not confirmed.",
        event.channel,
        event.thread_ts,
      );
      return;
    }

    // Process the command
    const args = event.text.split(" ");
    const subCommand = args[1]?.toLowerCase();

    switch (subCommand) {
      case "list": {
        // Support: team list <#channel>
        const channelArg = args[2];
        await this.listTeams(event, client, channelArg);
        break;
      }
      case "add":
        await this.addTeam(args.slice(2), event, client);
        break;
      case "edit":
        await this.editTeam(args.slice(2), event, client);
        break;
      case "delete":
        await this.deleteTeam(args.slice(2), event, client);
        break;
      case "help":
      default:
        await this.showHelp(client, event);
    }
  }

  /**
   * Optimized team listing method for handling large numbers of teams reliably
   * If channelArg is provided, only list that team.
   */
  private async listTeams(
    event: any,
    slackClient: any,
    channelArg?: string,
  ): Promise<void> {
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

      let teamsArray = Array.from(TEAMS_LIST.entries()).map(([, team]) => team);
      if (channelArg) {
        // Try to extract channel ID from the argument
        const channelId = extractIDFromChannelString(channelArg);
        if (channelId && TEAMS_LIST.has(channelId)) {
          const team = TEAMS_LIST.get(channelId);
          // Only send details for this team
          const detailMessage = this.createDetailedTeamMessage([team], 0);
          await sendSlackMessage(
            slackClient,
            detailMessage,
            event.channel,
            event.thread_ts,
          );
          return;
        } else {
          await sendSlackMessage(
            slackClient,
            `No team found for channel ${channelArg}.`,
            event.channel,
            event.thread_ts,
          );
          return;
        }
      }

      // Default: all teams
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
   * Format cron schedule with human-readable times in different timezones
   */
  private formatCronSchedule(
    cronExpression: string | null | undefined,
    scheduleType: string,
  ): string {
    if (!cronExpression) {
      return "";
    }

    try {
      const gmtCron = cronstrue.toString(cronExpression);

      // If the cron expression is invalid, only show the raw expression
      if (gmtCron === "Invalid cron expression") {
        return `• ${scheduleType} Schedule: \`${cronExpression}\`\n`;
      }

      // Extract hour and minute from the cronstrue output (e.g., 'At 08:30, Monday through Friday')
      const timeMatch = gmtCron.match(/At (\d{2}):(\d{2})/);
      let gmtHour = 0;
      let gmtMinute = 0;
      if (timeMatch) {
        gmtHour = parseInt(timeMatch[1], 10);
        gmtMinute = parseInt(timeMatch[2], 10);
      }

      // Calculate IDT time (GMT+3)
      let idtHour = gmtHour + 3;
      let idtMinute = gmtMinute;
      let nextDay = false;
      if (idtHour >= 24) {
        idtHour = idtHour % 24;
        nextDay = true;
      }
      // Format IDT time as HH:MM
      const idtTime = `${idtHour.toString().padStart(2, "0")}:${idtMinute.toString().padStart(2, "0")}`;
      const restOfCronText = gmtCron.split(",")[1] || "";

      return (
        `• ${scheduleType} Schedule: \`${cronExpression}\`\n` +
        `• ${scheduleType} Schedule (GMT): ${gmtCron}\n` +
        `• ${scheduleType} Schedule (IDT): At ${idtTime}${nextDay ? " (next day)" : ""}${restOfCronText ? "," + restOfCronText : ""}\n`
      );
    } catch (error) {
      logger.error(`Error formatting cron expression: ${error}`);
      return `• ${scheduleType} Schedule: \`${cronExpression}\`\n`;
    }
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

      // Add schedules with human-readable format
      if (team.ask_channel_cron) {
        message += this.formatCronSchedule(team.ask_channel_cron, "Ask");
      }

      if (team.zendesk_channel_cron) {
        message += this.formatCronSchedule(
          team.zendesk_channel_cron,
          "Zendesk",
        );
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
    slackClient: any,
  ): Promise<void> {
    try {
      // Basic validation
      if (args.length < 1) {
        await sendSlackMessage(
          slackClient,
          "Please provide channel information: `team add #channel-name [cron schedule]`",
          event.channel,
          event.thread_ts,
        );
        return;
      }

      // Extract channel information
      const channelRef = args[0];
      const channelId = extractIDFromChannelString(channelRef);
      let channelName = extractNameFromChannelString(channelRef);

      if (!channelId) {
        logger.warn(`Did not find a valid Slack channel in ${channelRef}.`);
        await sendSlackMessage(
          slackClient,
          "Please provide a valid Slack channel: `team add #channel-name`",
          event.channel,
          event.thread_ts,
        );
        return;
      }

      // Check if team already exists
      if (TEAMS_LIST.has(channelId)) {
        await sendSlackMessage(
          slackClient,
          `A team with channel ID <#${channelId}> already exists. Unable to add a new team for <#${channelId}|${channelName}>.`,
          event.channel,
          event.thread_ts,
        );
        return;
      }

      // Create new team with basic configuration
      const cronSchedule = args.length > 1 ? args[1] : "";

      if (!channelName) {
        const retrievedChannelName = await getConversationName(
          slackClient,
          channelId,
        );
        if (!retrievedChannelName) {
          await sendSlackMessage(
            slackClient,
            "Could not retrieve channel name from Slack API. Please check if the channel exists and the bot has access to it.",
            event.channel,
            event.thread_ts,
          );
          return;
        }
        channelName = retrievedChannelName;
      }

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
          event.thread_ts,
        );
      } else {
        await sendSlackMessage(
          slackClient,
          `Failed to add team for channel <#${channelId}|${channelName}>. Please check logs.`,
          event.channel,
          event.thread_ts,
        );
      }
    } catch (error) {
      logger.error("Error adding team:", error);
      await sendSlackMessage(
        slackClient,
        "An error occurred while adding the team. Please check logs for details.",
        event.channel,
        event.thread_ts,
      );
    }
  }

  private async editTeam(
    args: string[],
    event: any,
    slackClient: any,
  ): Promise<void> {
    try {
      // Basic validation - require channel, property, and value
      if (args.length < 3) {
        await sendSlackMessage(
          slackClient,
          "Please provide: `team edit #channel-name property value`",
          event.channel,
          event.thread_ts,
        );
        return;
      }

      // Extract channel information
      const channelRef = args[0];
      const channelId = extractIDFromChannelString(channelRef);

      if (!channelId) {
        logger.warn(`Did not find a valid Slack channel in ${channelRef}`);
        await sendSlackMessage(
          slackClient,
          "Please provide a valid Slack channel: `team edit #channel-name`",
          event.channel,
          event.thread_ts,
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
          event.thread_ts,
        );
        return;
      }

      // Get property and value
      const property = args[1];
      const value = args.slice(2).join(" ").trim();

      // Validate property
      if (!(property in team)) {
        await sendSlackMessage(
          slackClient,
          `Invalid property "${property}". Valid properties are: ${Object.keys(team).join(", ")}`,
          event.channel,
          event.thread_ts,
        );
        return;
      }

      // Validate cron expressions if applicable
      if (
        (property === "ask_channel_cron" ||
          property === "zendesk_channel_cron") &&
        value.toUpperCase() !== "EMPTY" &&
        !isValidCronExpression(value)
      ) {
        await sendSlackMessage(
          slackClient,
          `Invalid cron schedule format for ${property}. Please use a valid cron expression (e.g., "0 9 * * 1-5" for weekdays at 9 AM).`,
          event.channel,
          event.thread_ts,
        );
        return;
      }

      // Create update data object
      const updateData: any = {};

      // Handle special cases for array properties
      if (property === "allowed_bots" || property === "zendesk_field_values") {
        if (value.toUpperCase() === "EMPTY") {
          updateData[property] = [];
        } else {
          updateData[property] = value
            ? value.split(",").map((item: string) => item.trim())
            : [];
        }
      } else if (property === "ask_channel_id") {
        if (value.toUpperCase() === "EMPTY") {
          updateData["ask_channel_id"] = "";
          updateData["ask_channel_name"] = "";
        } else {
          const newChannelId = extractIDFromChannelString(value);
          if (!newChannelId) {
            await sendSlackMessage(
              slackClient,
              "Please provide a valid Slack channel for the new ask_channel_id: `team edit #channel-name ask_channel_id #new-channel-name`",
              event.channel,
              event.thread_ts,
            );
            return;
          }
          const newChannelName = extractNameFromChannelString(value);
          updateData["ask_channel_id"] = newChannelId;
          updateData["ask_channel_name"] = newChannelName;
        }
      } else if (property === "ask_channel_name") {
        updateData["ask_channel_name"] =
          value.toUpperCase() === "EMPTY" ? "" : value;
      } else if (property === "zendesk_channel_id") {
        if (value.toUpperCase() === "EMPTY") {
          updateData["zendesk_channel_id"] = "";
          updateData["zendesk_channel_name"] = "";
        } else {
          const newChannelId = extractIDFromChannelString(value);
          if (!newChannelId) {
            await sendSlackMessage(
              slackClient,
              "Please provide a valid Slack channel for the new zendesk_channel_id: `team edit #channel-name zendesk_channel_id #new-channel-name`",
              event.channel,
              event.thread_ts,
            );
            return;
          }
          const newChannelName = extractNameFromChannelString(value);
          updateData["zendesk_channel_id"] = newChannelId;
          updateData["zendesk_channel_name"] = newChannelName;
        }
      } else {
        updateData[property] = value.toUpperCase() === "EMPTY" ? "" : value;
      }

      // Save to database using service
      const success = await TeamService.updateTeam(channelId, updateData);

      if (success) {
        // Update in-memory map - using type assertion to avoid TS errors
        const teamAny = team as any;

        // Handle ask_channel_id update in TEAMS_LIST
        if (property === "ask_channel_id") {
          TEAMS_LIST.delete(channelId);
          teamAny.ask_channel_id = updateData.ask_channel_id;
          teamAny.ask_channel_name = updateData.ask_channel_name;
          TEAMS_LIST.set(updateData.ask_channel_id, {
            ...teamAny,
            ...updateData,
          });
        } else {
          // Always update the in-memory object with the latest data
          Object.assign(teamAny, updateData);
        }

        await sendSlackMessage(
          slackClient,
          `Successfully updated team for channel <#${channelId}|${team.ask_channel_name}>\n` +
            `Updated property: ${property}\n` +
            `New value: ${value || "empty"}`,
          event.channel,
          event.thread_ts,
        );
      } else {
        await sendSlackMessage(
          slackClient,
          `Failed to update team for channel <#${channelId}|${team.ask_channel_name}>. Please check logs.`,
          event.channel,
          event.thread_ts,
        );
      }
    } catch (error) {
      logger.error("Error updating team:", error);
      await sendSlackMessage(
        slackClient,
        "An error occurred while updating the team. Please check logs for details.",
        event.channel,
        event.thread_ts,
      );
    }
  }

  private async deleteTeam(
    args: string[],
    event: any,
    slackClient: any,
  ): Promise<void> {
    try {
      // Basic validation
      if (args.length < 1) {
        await sendSlackMessage(
          slackClient,
          "Please provide a channel: `team delete #channel-name`",
          event.channel,
          event.thread_ts,
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
          event.thread_ts,
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
          event.thread_ts,
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
          event.thread_ts,
        );
      } else {
        await sendSlackMessage(
          slackClient,
          `Failed to delete team for channel <#${channelId}|${team.ask_channel_name}>. Please check logs.`,
          event.channel,
          event.thread_ts,
        );
      }
    } catch (error) {
      logger.error("Error deleting team:", error);
      await sendSlackMessage(
        slackClient,
        "An error occurred while deleting the team. Please check logs for details.",
        event.channel,
        event.thread_ts,
      );
    }
  }

  private async showHelp(
    client: WebClient,
    event: SlackEventType,
  ): Promise<void> {
    const helpMessage = `
*Team Administration Commands*

- \`team list\` - List all configured teams
- \`team list #channel-name\` - Show detailed information for a specific team
- \`team add #channel-name [cron schedule]\` - Add a new team
- \`team edit #channel-name property value\` - Edit a team property
- \`team delete #channel-name\` - Delete a team
- \`team help\` - Show this help message
    `;

    await sendSlackMessage(client, helpMessage, event.channel, event.thread_ts);
  }
}
