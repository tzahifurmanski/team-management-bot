import { BotAction } from "../base_action";
import {
  AskChannelParams,
  getAskChannelParameters,
  getStartingDate,
  removeTimeInfoFromDate,
  scheduleCron,
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
  LEADS_SUMMARY_CHANNEL_ID,
  LEADS_SUMMARY_CHANNEL_NAME,
  SlackWebClient,
  TEAM_ASK_CHANNEL_ID,
} from "../../integrations/slack/consts";
import { sanitizeCommandInput } from "../../integrations/slack/utils";
import { LEADS_SUMMARY_CRON, TEAM_NAME } from "../../consts";
import { sendSlackMessage } from "../../integrations/slack/messages";

export class AskChannelStatusStatsOrSummary implements BotAction {
  constructor() {
    if (this.isEnabled()) {
      // Manually run the Get Channel stats for Yesterday action
      scheduleCron(
        !!(
          LEADS_SUMMARY_CRON &&
          (LEADS_SUMMARY_CHANNEL_ID || LEADS_SUMMARY_CHANNEL_NAME)
        ),
        "post a leads summary",
        LEADS_SUMMARY_CRON,
        this.postWeeklyLeadsStats,
        {
          channel: LEADS_SUMMARY_CHANNEL_ID,
          thread_ts: "",
        },
        SlackWebClient
      );
    }
  }

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
    return !!TEAM_ASK_CHANNEL_ID;
  }

  doesMatch(event: any): boolean {
    return (
      sanitizeCommandInput(event.text).startsWith("ask channel stats") ||
      sanitizeCommandInput(event.text).startsWith("ask channel status") ||
      sanitizeCommandInput(event.text).startsWith("ask channel summary")
    );
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    // Get the timeframe to operate on
    const params: AskChannelParams = getAskChannelParameters(
      sanitizeCommandInput(event.text)
    );
    if (params.error) {
      console.log(
        `There was an error processing the stats params for ${event.text} command: ${params.error}`
      );

      throw new Error(
        `There was an error processing the stats params: ${params.error}`
      );
    }

    const startingDate = getStartingDate(params);
    const endingDate = new Date();
    console.log(
      `"Date between ${startingDate.toUTCString()} and ${endingDate.toUTCString()}`
    );

    // Get the stats
    const messages: any[any] = await getChannelMessages(
      slackClient,
      startingDate,
      endingDate
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
        messages
      );
    } else {
      await this.processGroupByRequest(
        slackClient,
        params,
        startingDate,
        endingDate,
        event,
        messages
      );
    }
  }

  async processTotalRequest(
    slackClient: any,
    params: AskChannelParams,
    startingDate: any,
    endingDate: any,
    event: any,
    messages: any[any]
  ) {
    console.log("Handling a total request..");
    const stats: AsksChannelStatsResult = await getStatsForMessages(
      TEAM_ASK_CHANNEL_ID,
      messages,
      startingDate.toUTCString(),
      endingDate.toUTCString()
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
      includeReport
    );
  }

  async processGroupByRequest(
    slackClient: any,
    params: AskChannelParams,
    startingDate: any,
    endingDate: any,
    event: any,
    messages: any[any]
  ) {
    console.log("Handling a group by request..");
    const statsArray: AsksChannelStatsResult[] = await getStatsBuckets(
      messages,
      params.groupBy,
      TEAM_ASK_CHANNEL_ID
    );

    // TODO: Add a counter to how many bulk we had.
    for (const stats of statsArray) {
      console.log(
        `Currently processing block for ${stats.startDateInUTC} to ${stats.endDateInUTC}...`
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
        includeReport
      );
    }

    if (params.actionType === "summary") {
      await reportChartToSlack(
        slackClient,
        statsArray,
        event.channel,
        event.thread_ts
      );

      // TODO: Add a total message
    }

    console.log("Done handling a group by request..");
  }

  async postWeeklyLeadsStats(event: any, slackClient: any): Promise<void> {
    // TODO: Temporary fix. If client is null, get it again from consts.
    if (!slackClient) {
      slackClient = SlackWebClient;
    }

    console.log("Posting the weekly leads asks channel stats summary");

    // Get the timeframe for the last 7 days
    const DAYS_BACK = 7;
    const startTimeframe = new Date(
      new Date().getTime() - DAYS_BACK * 24 * 60 * 60 * 1000
    );
    removeTimeInfoFromDate(startTimeframe);

    const tempDate = new Date();
    removeTimeInfoFromDate(tempDate);
    const endingDate = new Date(tempDate.getTime() - 1);

    const monthMessages: any[any] = await getChannelMessages(
      slackClient,
      startTimeframe
    );
    const monthStats: AsksChannelStatsResult = await getStatsForMessages(
      TEAM_ASK_CHANNEL_ID,
      monthMessages,
      startTimeframe.toUTCString(),
      endingDate.toUTCString()
    );
    await sendSlackMessage(
      SlackWebClient,
      `Good morning ${TEAM_NAME} leads :sunny:\nIn the previous ${DAYS_BACK} days, team ${TEAM_NAME} had a *total of ${monthStats.totalMessages} asks*. Out of those, *${monthStats.totalNumProcessed} were answered*, *${monthStats.totalNumInProgress} are in progress*, and *${monthStats.totalNumUnchecked} were not handled*.`,
      event.channel,
      event.thread_ts
    );
  }
}
