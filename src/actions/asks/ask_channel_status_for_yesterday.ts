import { BotAction } from "../base_action";
import { removeTimeInfoFromDate, scheduleCron } from "../utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsForMessages,
  reportStatsToSlack,
} from "../../logic/asks_channel";
import {
  SlackWebClient,
  TEAM_ASK_CHANNEL_ID,
} from "../../integrations/slack/consts";
import { sendSlackMessage } from "../../integrations/slack/messages";
import { sanitizeCommandInput } from "../../integrations/slack/utils";
import { ASK_CHANNEL_STATS_CRON, TEAM_FOLKS } from "../../consts";
import cronstrue from "cronstrue";

export class AskChannelStatusForYesterday implements BotAction {
  constructor() {
    if (this.isEnabled()) {
      scheduleCron(
        !!ASK_CHANNEL_STATS_CRON,
        "update on ask channel stats",
        ASK_CHANNEL_STATS_CRON,
        this.getAskChannelStatsForYesterday,
        {
          channel: TEAM_ASK_CHANNEL_ID,
          thread_ts: "",
        },
        SlackWebClient
      );
    }
  }

  getHelpText(): string {
    let helpMessage =
      "`ask channel status for yesterday` - Get the status of requests in your team ask channel from yesterday and a current status going back for the last 60 days.";
    if (ASK_CHANNEL_STATS_CRON) {
      helpMessage += `\n*A recurring ask channel post is scheduled to be sent ${cronstrue.toString(
        ASK_CHANNEL_STATS_CRON
      )}.*`;
    }
    return helpMessage;
  }

  isEnabled(): boolean {
    // This action should be available if there is an asks channel to process
    return !!TEAM_ASK_CHANNEL_ID;
  }

  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith(
      "ask channel status for yesterday"
    );
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    await this.getAskChannelStatsForYesterday(event, slackClient);
  }

  async getAskChannelStatsForYesterday(
    event: any,
    slackClient: any
  ): Promise<void> {
    // TODO: Temporary fix. If client is null, get it again from consts.
    if (!slackClient) {
      slackClient = SlackWebClient;
    }

    console.log("Posting the daily asks channel stats summary");

    // Set the timeframe range to be yesterday
    const startingDate = new Date();
    startingDate.setDate(startingDate.getDate() - 1);
    removeTimeInfoFromDate(startingDate);

    const tempDate = new Date();
    removeTimeInfoFromDate(tempDate);
    const endingDate = new Date(tempDate.getTime() - 1);
    console.log(
      `timeframe is ${startingDate.toUTCString()} to ${endingDate.toUTCString()}`
    );

    const messages: any[any] = await getChannelMessages(
      slackClient,
      startingDate,
      endingDate
    );

    const stats: AsksChannelStatsResult = await getStatsForMessages(
      TEAM_ASK_CHANNEL_ID,
      messages,
      startingDate.toUTCString(),
      endingDate.toUTCString()
    );

    const yesterdaySummary = `Good morning ${TEAM_FOLKS}:sunny:\nYesterday, <#${TEAM_ASK_CHANNEL_ID}> received a *total of ${stats.totalMessages} new asks*. Out of those, *${stats.totalNumProcessed} were answered*, *${stats.totalNumInProgress} are in progress*, and *${stats.totalNumUnchecked} were not handled*.`;

    // Say what's the total of open asks we have in the last 60 days
    // =============================================================================

    // Get the timeframe for the last 60 days
    const DAYS_BACK = 60;
    const beginningOfMonthDate = new Date(
      new Date().getTime() - DAYS_BACK * 24 * 60 * 60 * 1000
    );
    removeTimeInfoFromDate(beginningOfMonthDate);
    const now = new Date();

    console.log(
      `60 days back timeframe is ${beginningOfMonthDate.toUTCString()} to ${now.toUTCString()}`
    );

    const monthMessages: any[any] = await getChannelMessages(
      slackClient,
      beginningOfMonthDate,
      now
    );
    const monthStats: AsksChannelStatsResult = await getStatsForMessages(
      TEAM_ASK_CHANNEL_ID,
      monthMessages,
      beginningOfMonthDate.toUTCString(),
      now.toUTCString()
    );
    await sendSlackMessage(
      slackClient,
      `${yesterdaySummary}\nIn the last ${DAYS_BACK} days, <#${TEAM_ASK_CHANNEL_ID}> had a *total of ${monthStats.totalMessages} asks*. Out of those, *${monthStats.totalNumProcessed} were answered*, *${monthStats.totalNumInProgress} are in progress*, and *${monthStats.totalNumUnchecked} were not handled*.`,
      event.channel,
      event.thread_ts
    );

    // Post the links for the various open stats
    await reportStatsToSlack(
      slackClient,
      monthStats,
      event.channel,
      event.thread_ts,
      false,
      true,
      false
    );
  }
}
