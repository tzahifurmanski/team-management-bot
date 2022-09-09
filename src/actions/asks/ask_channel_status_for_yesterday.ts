import { BotAction } from "../base_action";
import {removeTimeInfoFromDate} from "../utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsForMessages,
  reportStatsToSlack,
} from "../../logic/asks_channel";
import {
  LEADS_SUMMARY_CHANNEL_ID,
  LEADS_SUMMARY_CHANNEL_NAME,
  TEAM_ASK_CHANNEL_ID
} from "../../integrations/slack/consts";
import { sendSlackMessage } from "../../integrations/slack/messages";
import {sanitizeCommandInput} from "../../integrations/slack/utils";
import {ASK_CHANNEL_STATS_CRON, LEADS_SUMMARY_CRON, TEAM_FOLKS} from "../../consts";
import cronstrue from "cronstrue";
const cron = require("node-cron");
import {getAskChannelStatsForYesterday, postWeeklyLeadsStats} from "../../logic/cron_jobs";


export class AskChannelStatusForYesterday implements BotAction {
  constructor(){
    if(this.isEnabled()) {
      if (ASK_CHANNEL_STATS_CRON) {
        console.log(
            `Setting up a cron to update on ask channel stats (cron: ${ASK_CHANNEL_STATS_CRON}, ${cronstrue.toString(ASK_CHANNEL_STATS_CRON)})`
        );
        cron.schedule(ASK_CHANNEL_STATS_CRON, () => {
          // TODO: Replace this and the implementation of this file to use one implementation
          getAskChannelStatsForYesterday();
        })
      }

      if (LEADS_SUMMARY_CRON && (LEADS_SUMMARY_CHANNEL_ID || LEADS_SUMMARY_CHANNEL_NAME)) {
        console.log(
            `Setting up a cron to post a leads summary (cron:  ${LEADS_SUMMARY_CRON}).`
        );

        cron.schedule(LEADS_SUMMARY_CRON, () => {
          postWeeklyLeadsStats();
        });
      }
    }
  }

  getHelpText(): string {
    let helpMessage = "`ask channel status for yesterday` - Get the status of requests in your team ask channel from yesterday and a current status going back for the last 60 days."
    if (ASK_CHANNEL_STATS_CRON) {
      helpMessage += `\n*A recurring ask channel post is scheduled to be sent ${cronstrue.toString(ASK_CHANNEL_STATS_CRON)}.*`;
    }
    return helpMessage;
  }

  isEnabled(): boolean {
    // This action should be available if there is an asks channel to process
    return !!(TEAM_ASK_CHANNEL_ID);
  }

  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith("ask channel status for yesterday");
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
    await reportStatsToSlack(monthStats, event.channel, event.thread_ts, false);
  }
}
