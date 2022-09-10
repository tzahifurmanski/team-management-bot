import { removeTimeInfoFromDate } from "../actions/utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsForMessages,
} from "./asks_channel";
import { sendSlackMessage } from "../integrations/slack/messages";
import {
  LEADS_SUMMARY_CHANNEL_ID,
  ONCALL_CHANNEL_ID,
  SlackWebClient,
  TEAM_ASK_CHANNEL_ID,
} from "../integrations/slack/consts";
import { AskChannelStatusForYesterday } from "../actions/asks/ask_channel_status_for_yesterday";
import { OncallTicketsStatus } from "../actions/asks/oncall_tickets_status";
import { TEAM_NAME } from "../consts";

export const getAskChannelStatsForYesterday = async () => {
  // Manually run the Get Channel stats for Yesterday action
  const event: any = {
    channel: TEAM_ASK_CHANNEL_ID,
    thread_ts: "",
  };
  await new AskChannelStatusForYesterday().performAction(event, SlackWebClient);
};

export const getOncallTicketsStatus = async () => {
  // Manually run the Get Channel stats for Yesterday action
  const event: any = {
    channel: ONCALL_CHANNEL_ID,
    thread_ts: "",
  };
  await new OncallTicketsStatus().performAction(event, SlackWebClient);
};

export const postWeeklyLeadsStats = async () => {
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
    SlackWebClient,
    `Good morning ${TEAM_NAME} leads :sunny:\nIn the previous ${DAYS_BACK} days, team ${TEAM_NAME} had a *total of ${monthStats.totalMessages} asks*. Out of those, *${monthStats.totalNumProcessed} were answered*, *${monthStats.totalNumInProgress} are in progress*, and *${monthStats.totalNumUnchecked} were not handled*.`,
    LEADS_SUMMARY_CHANNEL_ID
  );
};
