import { BotAction } from "../base_action";
import {removeTimeInfoFromDate} from "../utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsForMessages,
  reportStatsToSlack,
} from "../../logic/asks_channel";
import { TEAM_ASK_CHANNEL_ID } from "../../integrations/slack/consts";
import { sendSlackMessage } from "../../integrations/slack/messages";
import {sanitizeCommandInput} from "../../integrations/slack/utils";
import {TEAM_FOLKS} from "../../consts";

export class AskChannelStatsForYesterday implements BotAction {
  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith("ask channel stats for yesterday");
  }

  async performAction(event: any): Promise<void> {
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
      `${yesterdaySummary}\nIn the last ${DAYS_BACK} days, <#${TEAM_ASK_CHANNEL_ID}> had a *total of ${monthStats.totalMessages} asks*. Out of those, *${monthStats.totalNumProcessed} were answered*, *${monthStats.totalNumInProgress} are in progress*, and *${monthStats.totalNumUnchecked} were not handled*.`,
      event.channel,
      event.thread_ts
    );

    // Post the links for the various open stats
    await reportStatsToSlack(monthStats, event.channel, "", false);
  }
}
