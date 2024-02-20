import { BotAction } from "../base_action";
import {
  AskChannelParams,
  getAskChannelParameters,
  getStartingDate,
} from "../utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsBuckets,
  getStatsForMessages,
  reportChartToSlack,
  reportStatsToSlack,
} from "../../logic/asks_channel";
import {
  ALLOWED_BOTS_PER_TEAM,
  TEAM_ASK_CHANNEL_ID,
} from "../../integrations/slack/consts";
import { sanitizeCommandInput } from "../../integrations/slack/utils";
import { logger } from "../../consts";

export class AskChannelStatusStatsOrSummary implements BotAction {
  getHelpText(): string {
    return (
      "`ask channel stats` - Get statistics on the requests in your team ask channel.\n" +
      "• `ask channel status` - Get the status of the requests in your team ask channel.\n" +
      "• `ask channel summary` - Get the status summary of the requests in your team ask channel.\n" +
      "For stats, status and summary actions - \n" +
      "1. The default timeframe is for 7 days. You can specify the number of days / weeks / months " +
      "(For example: `ask channel stats 15 days`, `ask channel status 2 weeks`).\n" +
      "2. You can aggregate the results by days/weeks/months " +
      "(For example: `ask channel stats 15 days by days`, `ask channel status 2 weeks by weeks`)."
    );
  }

  isEnabled(): boolean {
    // This action should be available if there is an asks channel to process
    return TEAM_ASK_CHANNEL_ID.length > 0;
  }

  doesMatch(event: any): boolean {
    return (
      sanitizeCommandInput(event.text).startsWith("ask channel stats") ||
      sanitizeCommandInput(event.text).startsWith("ask channel status") ||
      sanitizeCommandInput(event.text).startsWith("ask channel summary")
    );
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    // TODO: Handle a situation of multiple ask channels

    // Get the timeframe to operate on
    const params: AskChannelParams = getAskChannelParameters(
      sanitizeCommandInput(event.text),
    );
    if (params.error) {
      logger.error(
        `There was an error processing the stats params for ${event.text} command: ${params.error}`,
      );

      throw new Error(
        `There was an error processing the stats params: ${params.error}`,
      );
    }

    const startingDate = getStartingDate(params);
    const endingDate = new Date();
    logger.debug(
      `"Date between ${startingDate.toUTCString()} and ${endingDate.toUTCString()}`,
    );

    // Get the stats
    const messages: any[any] = await getChannelMessages(
      slackClient,
      TEAM_ASK_CHANNEL_ID[0],
      ALLOWED_BOTS_PER_TEAM.get(TEAM_ASK_CHANNEL_ID[0]) || [],
      startingDate,
      endingDate,
    );

    // Check if there is a group by clause or is this a total
    if (!params.groupBy) {
      // Total
      await this.processTotalRequest(
        slackClient,
        params,
        startingDate,
        endingDate,
        event,
        messages,
      );
    } else {
      await this.processGroupByRequest(
        slackClient,
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
    params: AskChannelParams,
    startingDate: any,
    endingDate: any,
    event: any,
    messages: any[any],
  ) {
    logger.debug("Handling a total request..");
    const stats: AsksChannelStatsResult = await getStatsForMessages(
      TEAM_ASK_CHANNEL_ID[0],
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
      TEAM_ASK_CHANNEL_ID[0],
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
