import { removeTimeInfoFromDate } from "../actions/utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsForMessages,
} from "./asks_channel";
import { sendSlackMessage } from "../integrations/slack/messages";
import {
  ONCALL_CHANNEL_ID,
  TEAM_ASK_CHANNEL_ID,
  TEAM_LEADS_CHANNEL_ID,
} from "../integrations/slack/consts";
import { AskChannelStatsForYesterday } from "../actions/asks/ask_channel_stats_for_yesterday";
import {OncallTicketsStatus} from "../actions/asks/oncall_tickets_status";
import {TEAM_LEADS, TEAM_NAME} from "../consts";

export const getAskChannelStatsForYesterday = async function () {
  // Manually run the Get Channel stats for Yesterday action
  const event: any = {
    channel: TEAM_ASK_CHANNEL_ID,
    thread_ts: "",
  };
  await new AskChannelStatsForYesterday().performAction(event);
};

export const getOncallTicketsStatus = async function () {
  // Manually run the Get Channel stats for Yesterday action
  const event: any = {
    channel: ONCALL_CHANNEL_ID,
    thread_ts: "",
  };
  await new OncallTicketsStatus().performAction(event);
};

export const postWeeklyLeadsStats = async function () {
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

  const monthMessages: any[any] = await getChannelMessages(startTimeframe);
  const monthStats: AsksChannelStatsResult = await getStatsForMessages(
    TEAM_ASK_CHANNEL_ID,
    monthMessages,
    startTimeframe.toUTCString(),
    endingDate.toUTCString()
  );
  await sendSlackMessage(
    `Good morning ${TEAM_LEADS}:sunny:\nIn the previous ${DAYS_BACK} days, team ${TEAM_NAME} had a *total of ${monthStats.totalMessages} asks*. Out of those, *${monthStats.totalNumProcessed} were answered*, *${monthStats.totalNumInProgress} are in progress*, and *${monthStats.totalNumUnchecked} were not handled*.`,
    TEAM_LEADS_CHANNEL_ID
  );
};
