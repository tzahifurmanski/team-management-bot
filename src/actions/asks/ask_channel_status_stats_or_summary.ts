import { BotAction } from "../base_action";
import { AskChannelParams, getAskChannelParameters, getChannelIDFromEventText } from "../utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsBuckets,
  getStatsForMessages,
  reportChartToSlack,
  reportStatsToSlack,
} from "../../logic/asks_channel";
import { sanitizeCommandInput } from "../../integrations/slack/utils";
import { logger } from "../../settings/server_consts";
import { getStartingDate } from "../date_utils";
import { findTeamByValue, isValueInTeams } from "../../settings/team_utils";
import { sendSlackMessage } from "../../integrations/slack/messages";

export class AskChannelStatusStatsOrSummary implements BotAction {
  getHelpText(): string {
    return (
      "`ask channel stats #CHANNEL_NAME` - Get statistics on the requests for the requested team ask channel.\n" +
      "• `ask channel status #CHANNEL_NAME` - Get the status of the requests for the requested team ask channel.\n" +
      "• `ask channel summary #CHANNEL_NAME` - Get the status summary of the requests for the requested team ask channel.\n" +
      "For stats, status and summary actions - \n" +
      "1. The default timeframe is for 7 days. You can specify the number of days / weeks / months " +
      "(For example: `ask channel stats #team-ask-channel 15 days`, `ask channel status #team-ask-channel 2 weeks`).\n" +
      "2. You can aggregate the results by days/weeks/months " +
      "(For example: `ask channel stats #team-ask-channel 15 days by days`, " +
      "`ask channel status #team-ask-channel 2 weeks by weeks`)."
    );
  }

  isEnabled(): boolean {
    // This action should be available if there are any asks channel to process
    return isValueInTeams("ask_channel_id");
  }

  doesMatch(event: any): boolean {
    return (
      sanitizeCommandInput(event.text).startsWith("ask channel stats") ||
      (sanitizeCommandInput(event.text).startsWith("ask channel status") &&
      !sanitizeCommandInput(event.text).startsWith("ask channel status for yesterday")) ||
      sanitizeCommandInput(event.text).startsWith("ask channel summary")
    );
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    // Get the timeframe to operate on
    const params: AskChannelParams = getAskChannelParameters(
      sanitizeCommandInput(event.text),
    );
    if (params.error) {
      logger.error(
        `There was an error processing the stats params for ${event.text} command: ${params.error}`,
      );

      if(params.error === "Missing channel ID") {
        await sendSlackMessage(
          slackClient,
          `Please provide an asks channel in the form of \`ask channel status #ask-zigi\`.`,
          event.channel,
          event.thread_ts,
        );
        return;
      }
      else
      {
        // TODO: This will override the message about missing channel ID
        throw new Error(
          `There was an error processing the stats params: ${params.error}`,
        );
      }
    }

    const startingDate = getStartingDate(params.timeMetric, params.count);
    const endingDate = new Date();
    logger.debug(
      `"Date between ${startingDate.toUTCString()} and ${endingDate.toUTCString()}`,
    );

    // Get the channel ID
    const askChannelId = getChannelIDFromEventText(
      event.text,
      params.channel_id_slot,
    );

    const team = findTeamByValue(askChannelId, "ask_channel_id");
    if (!team) {
      logger.error(
        `Unable to find team for channel ID ${askChannelId}. Ask: ${event.text}`,
      );

      if (!askChannelId) {
        await sendSlackMessage(
          slackClient,
          `Please provide an asks channel in the form of \`ask channel status for yesterday #ask-zigi\`.`,
          event.channel,
          event.thread_ts,
        );
      }
      else {
        await sendSlackMessage(
          slackClient,
          "Channels is not set up for monitoring. For setting it up, please contact your administrator.",
          event.channel,
          event.thread_ts,
        );
      }
  
      return;
    }

    logger.debug(`Found team for channel ID ${askChannelId}.`);


    // Get the stats
    const messages: any[any] = await getChannelMessages(
      slackClient,
      team.ask_channel_id,
      team.allowed_bots,
      startingDate,
      endingDate,
    );

    // Check if there is a group by clause or is this a total
    if (!params.groupBy) {
      // Total
      await this.processTotalRequest(
        slackClient,
        team.ask_channel_id,
        params,
        startingDate,
        endingDate,
        event,
        messages,
      );
    } else {
      await this.processGroupByRequest(
        slackClient,
        team.ask_channel_id,
        params,
        startingDate,
        endingDate,
        event,
        messages,
      );
    }
  }

  async processTotalRequest(
    slackClient: any,
    channel_id: string,
    params: AskChannelParams,
    startingDate: any,
    endingDate: any,
    event: any,
    messages: any[any],
  ) {
    logger.debug("Handling a total request..");
    const stats: AsksChannelStatsResult = await getStatsForMessages(
      channel_id,
      messages,
      startingDate.toUTCString(),
      endingDate.toUTCString(),
    );

    // Report the results based on the requested status
    let includeSummary;
    let includeAsks;
    let includeReport;
    if (params.actionType == "stats") {
      includeSummary = true;
      includeAsks = false;
      includeReport = true;
    } else if (params.actionType === "status") {
      includeSummary = true;
      includeAsks = true;
      includeReport = false;
    } else if (params.actionType === "summary") {
      includeSummary = true;
      includeAsks = false;
      includeReport = false;
    }

    await reportStatsToSlack(
      slackClient,
      stats,
      event.channel,
      event.thread_ts,
      includeSummary,
      includeAsks,
      includeReport,
    );
  }

  async processGroupByRequest(
    slackClient: any,
    channel_id: string,
    params: AskChannelParams,
    startingDate: any,
    endingDate: any,
    event: any,
    messages: any[any],
  ) {
    logger.info("Handling a group by request..");
    const statsArray: AsksChannelStatsResult[] = await getStatsBuckets(
      messages,
      params.groupBy,
      channel_id,
    );

    // TODO: Add a counter to how many bulk we had.
    for (const stats of statsArray) {
      logger.info(
        `Currently processing block for ${stats.startDateInUTC} to ${stats.endDateInUTC}...`,
      );
      // Report the results based on the requested status
      let includeSummary;
      let includeAsks;
      let includeReport;
      if (params.actionType == "stats") {
        includeSummary = true;
        includeAsks = false;
        includeReport = true;
      } else if (params.actionType === "status") {
        includeSummary = true;
        includeAsks = true;
        includeReport = false;
      } else if (params.actionType === "summary") {
        includeSummary = true;
        includeAsks = false;
        includeReport = false;
      }
      await reportStatsToSlack(
        slackClient,
        stats,
        event.channel,
        event.thread_ts,
        includeSummary,
        includeAsks,
        includeReport,
      );
    }

    if (params.actionType === "summary") {
      await reportChartToSlack(
        slackClient,
        statsArray,
        event.channel,
        event.thread_ts,
      );

      // TODO: Add a total message
    }

    logger.info("Done handling a group by request.");
  }
}
