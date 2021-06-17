import { removeTimeInfoFromDate } from "../actions/utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsBuckets,
  getStatsForMessages,
  reportStatsToSlack,
} from "./asks_channel";
import { sendSlackMessage } from "../integrations/slack/messages";
import {
  TEAM_ASK_CHANNEL_ID,
  TEAM_LEADS_CHANNEL_ID,
} from "../integrations/slack/consts";

export const getAskChannelStatsForYesterday = async function () {
  console.log("Posting the daily asks channel stats summary");

  // Set the timeframe range to be yesterday
  const startingDate = new Date();
  startingDate.setDate(startingDate.getDate() - 1);
  removeTimeInfoFromDate(startingDate);

  const tempDate = new Date();
  removeTimeInfoFromDate(tempDate);
  const endingDate = new Date(tempDate.getTime() - 1);
  // console.log(
  //   `timeframe is ${startingDate.toUTCString()} to ${endingDate.toUTCString()}`
  // );

  const messages: any[any] = await getChannelMessages(startingDate, endingDate);

  const stats: AsksChannelStatsResult = await getStatsForMessages(
    TEAM_ASK_CHANNEL_ID,
    messages,
    startingDate.toUTCString(),
    endingDate.toUTCString()
  );

  await sendSlackMessage(
    `Good morning ${process.env.TEAM_FOLKS}:sunny:\nYesterday, <#${TEAM_ASK_CHANNEL_ID}> received a *total of ${stats.totalMessages} new asks*. Out of those, *${stats.totalNumProcessed} were answered*, *${stats.totalNumInProgress} are in progress*, and *${stats.totalNumUnchecked} were not handled*.`,
    TEAM_ASK_CHANNEL_ID
  );

  // Say what's the total of open asks we have in the last 60 days
  // =============================================================================

  // Get the timeframe for the last 60 days
  const DAYS_BACK = 60;
  const beginningOfMonthDate = new Date(
    new Date().getTime() - DAYS_BACK * 24 * 60 * 60 * 1000
  );
  removeTimeInfoFromDate(beginningOfMonthDate);
  const now = new Date();

  const monthMessages: any[any] = await getChannelMessages(
    beginningOfMonthDate
  );
  const monthStats: AsksChannelStatsResult = await getStatsForMessages(
    TEAM_ASK_CHANNEL_ID,
    monthMessages,
    beginningOfMonthDate.toUTCString(),
    now.toUTCString()
  );
  await sendSlackMessage(
    `In the last ${DAYS_BACK} days, <#${TEAM_ASK_CHANNEL_ID}> had a *total of ${monthStats.totalMessages} asks*. Out of those, *${monthStats.totalNumProcessed} were answered*, *${monthStats.totalNumInProgress} are in progress*, and *${monthStats.totalNumUnchecked} were not handled*.`,
    TEAM_ASK_CHANNEL_ID
  );

  // Post the links for the various open stats
  await reportStatsToSlack(monthStats, TEAM_ASK_CHANNEL_ID, "");
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
    `Good morning ${process.env.TEAM_LEADS}:sunny:\nIn the previous ${DAYS_BACK} days, team ${process.env.TEAM_NAME} had a *total of ${monthStats.totalMessages} asks*. Out of those, *${monthStats.totalNumProcessed} were answered*, *${monthStats.totalNumInProgress} are in progress*, and *${monthStats.totalNumUnchecked} were not handled*.`,
    TEAM_LEADS_CHANNEL_ID
  );
};
