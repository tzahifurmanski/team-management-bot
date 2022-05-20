import { getConversationHistory } from '../integrations/slack/conversations';
import {
  REACTIONS_HANDLED,
  REACTIONS_IN_PROGRESS,
  TEAM_ASK_CHANNEL_ID,
  USER_PROFILE_FIELD_ID_TEAM
} from '../integrations/slack/consts';
import {
  createDivider,
  createSectionBlock,
  getMessagePermalink,
  sendSlackMessage
} from '../integrations/slack/messages';
import { removeTimeInfoFromDate, setDateToSunday, toDateTime } from '../actions/utils';
import { SectionBlock } from '@slack/web-api';
import {getUserProfile} from '../integrations/slack/users';
import {getValueFromProfile} from "../integrations/slack/utils";
import {Block} from "@slack/types";
import {AsksChannelReportResult, createReport, createReportSection} from "./ask_channel_reporting";


export interface AsksChannelStatsResult {
  startDateInUTC: string;
  endDateInUTC?: string;
  channelId: string;
  totalMessages: number;
  totalNumProcessed: number; // Processed message is one that is done / accomplished / handled
  totalNumInProgress: number;
  totalNumUnchecked: number;
  messages: any[];
  messagesInProgress: any[];
  messagesUnchecked: any[];
}

// This method gets two dates and returns all the messages that were received in the asks channel during this timeframe
export const getChannelMessages = async (startingDate: Date, endDate?: Date, askChannelId: string = TEAM_ASK_CHANNEL_ID
): Promise<any[any]> => {
  // console.log(
  //   `Getting ask channels messages between '${startingDate.toUTCString()}' and '${endDate?.toUTCString()}'`
  // );
  const oldestMessage = (startingDate.getTime() / 1000).toString();
  const latestMessage = endDate && (endDate.getTime() / 1000).toString();

  // console.log(`Timeframe between '${oldestMessage}' and '${latestMessage}'`);

  return await getConversationHistory(
    askChannelId,
    oldestMessage,
    latestMessage
  );
};

// This method gets a list of messages and a timeframe and returns stats on these messages
export const getStatsForMessages = (channelId: string, messages: any, startDateInUTC: string, endDateInUTC?: string
): AsksChannelStatsResult => {
  const messagesUnchecked = messages.filter((el: any) => {
    return (
      !el.reactions ||
      el.reactions.filter((reaction: any) => {
        return [...REACTIONS_IN_PROGRESS, ...REACTIONS_HANDLED].includes(reaction.name);
      }).length === 0
    );
  });

  // Go over all unchecked messages and get the permalinks
  const messagesInProgress = messages.filter((el: any) => {
    return (
      el?.reactions?.filter((reaction: any) => {
        return REACTIONS_IN_PROGRESS.includes(reaction.name);
      }).length > 0 &&
      el?.reactions.filter((reaction: any) => {
        return REACTIONS_HANDLED.includes(reaction.name);
      }).length === 0
    );
  });

  return {
    startDateInUTC,
    endDateInUTC,
    messages,
    messagesInProgress,
    messagesUnchecked,
    totalMessages: messages.length,
    totalNumProcessed:
      messages.length - messagesUnchecked.length - messagesInProgress.length,
    totalNumInProgress: messagesInProgress.length,
    totalNumUnchecked: messagesUnchecked.length,
    channelId,
  };
};

// TODO: Add a check that if the end date is after now, return now as the end date (as it's irrelevant)
export const getBucketRange = (messageDate: Date, type: string): Date[] => {
  if (type === "week") {
    // Build the starting and end dates for the bucket
    const weekStartDate = new Date(messageDate.getTime());
    setDateToSunday(weekStartDate);
    removeTimeInfoFromDate(weekStartDate);

    const weekEndDate = new Date(weekStartDate.getTime() - 1);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    return [weekStartDate, weekEndDate];
  } else if (type === "month") {
    const dayStartDate = new Date(
      Date.UTC(messageDate.getFullYear(), messageDate.getMonth(), 1)
    );

    const tempDate = new Date(
      messageDate.getFullYear(),
      messageDate.getMonth() + 1,
      1
    );
    const dayEndDate = new Date(tempDate.getTime() - 1);

    return [dayStartDate, dayEndDate];
  } else if (type === "day") {
    // Build the starting and end dates for the bucket
    const dayStartDate = new Date(messageDate.getTime());
    removeTimeInfoFromDate(dayStartDate);

    const dayEndDate = new Date(dayStartDate.getTime() - 1);
    dayEndDate.setDate(dayEndDate.getDate() + 1);

    return [dayStartDate, dayEndDate];
  }

  return [];
};

export const getStatsBuckets = async (
    messages: any[],
    type: string,
    channelId: string = TEAM_ASK_CHANNEL_ID // This can either bet 'week' or 'day'. This is the variable by which we're going to 'group by' the buckets
): Promise<AsksChannelStatsResult[]> => {
  const buckets = new Map<string, any[]>();
  const bucketsRanges: any = {};

  messages.map(async (message: any) => {
    // Check the date on the message
    const messageDate: Date = toDateTime(message.ts);

    const [bucketStartDate, bucketEndDate] = getBucketRange(messageDate, type);
    bucketsRanges[bucketStartDate.toUTCString()] = bucketEndDate.toUTCString();

    // console.log(
    //   `For message ${messageDate.toUTCString()} we got bucket range of ${bucketStartDate} to ${bucketEndDate}`
    // );

    const bucketKey = bucketStartDate.toUTCString();
    // Put the message in the relevant bucket
    if (buckets.has(bucketKey)) {
      const bucket = buckets.get(bucketKey);
      // @ts-ignore
      bucket.push(message);
    } else {
      const bucket: any[any] = [message];
      buckets.set(bucketKey, bucket);
    }
  });

  const results: AsksChannelStatsResult[] = [];

  // Convert the buckets to a list of stats
  for (const [key, currBucketMessages] of buckets.entries()) {
    // TODO: Find a way to pass the end date as well (right now it's empty)
    // const [startDate, endDate] = key;

    const stats: AsksChannelStatsResult = getStatsForMessages(
      channelId,
      currBucketMessages,
      key,
      bucketsRanges[key]
    );
    results.push(stats);
  }

  return results;
};

export const reportStatsToSlack = async (
    stats: AsksChannelStatsResult,
    destinationChannel: any,
    destinationThreadTS: any,
    includeSummary: boolean = true,
    includeAsks: boolean = true,
    includeReport: boolean = false
) => {
  // console.log("Time in utc - start", stats.startDateInUTC);
  // console.log("Time in utc - end", stats.endDateInUTC);

  const messageBlocks: Block[] = [];

  if (includeSummary) {
    const text = `<#${stats.channelId}> had a *total of ${stats.totalMessages} messages* between ${stats.startDateInUTC} and ${stats.endDateInUTC}.\nOut of those, *${stats.totalNumProcessed} were handled*, *${stats.totalNumInProgress} are in progress* and *${stats.totalNumUnchecked} were not handled*.`;
    messageBlocks.push(createSectionBlock(text));
  }

  if (includeAsks && stats.totalMessages > 0) {
    if (stats.totalNumInProgress > 0) {
      messageBlocks.push(
        createSectionBlock("These are the in progress asks we currently have:")
      );

      messageBlocks.push(
        ...(await getPermalinkBlocks(stats.channelId, stats.messagesInProgress))
      );
    }

    if (stats.totalNumUnchecked > 0) {
      messageBlocks.push(
        createSectionBlock("These are the open asks we currently have:")
      );
      messageBlocks.push(
        ...(await getPermalinkBlocks(stats.channelId, stats.messagesUnchecked))
      );
    }
  }

  // Post the messages info
  if (messageBlocks.length > 0) {
    await sendSlackMessage(
        `<#${stats.channelId}> had a *total of ${stats.totalMessages} messages* between ${stats.startDateInUTC} and ${stats.endDateInUTC}.\nOut of those, *${stats.totalNumProcessed} were handled*, *${stats.totalNumInProgress} are in progress* and *${stats.totalNumUnchecked} were not handled*.`,
        destinationChannel,
        destinationThreadTS,
        messageBlocks,
        true,
    );
  }

  const reportMessageBlocks: Block[] = [];

  if (includeReport && stats.totalMessages > 0) {
    const results : AsksChannelReportResult = await createReport(stats.messages);

    reportMessageBlocks.push(...createReportSection(results.statsByTeam, 'Team'));
    reportMessageBlocks.push(createDivider());
    reportMessageBlocks.push(...createReportSection(results.statsByDivision, 'Division'));
    reportMessageBlocks.push(createDivider());
    reportMessageBlocks.push(...createReportSection(results.statsByDepartment, 'Department'));
  }

  if (reportMessageBlocks.length > 0) {
    await sendSlackMessage(
      `Asks origin report`,
      destinationChannel,
      destinationThreadTS,
      reportMessageBlocks,
    );
  }
};

// This method gets a list of messages and creates a permalink string for displaying the message.
const getPermalinkBlocks = async (channelId: string, messages: any[]): Promise<SectionBlock[]> => {
  const block: SectionBlock[] = [];
  const dateToday = new Date();

  await Promise.all(
    messages.map(async (message: any) => {
      const permalink = await getMessagePermalink(channelId, message.ts);
      if (permalink) {
        const messageDate = toDateTime(message.ts);
        const daysDifference = Math.round(
          (dateToday.getTime() - messageDate.getTime()) / (1000 * 3600 * 24)
        );
        const daysMessage = daysDifference === 0 ? " (earlier today)" : daysDifference === 1 ? " (1 day ago)" : ` (${daysDifference} days ago)`;

        // TODO: Maybe only display the team name, when doing 'ask channel stats', and not when showing the stats for yesterday. Requires refactor.
        const userProfile = await getUserProfile(message.user) || {};
        let teamName = getValueFromProfile(userProfile, USER_PROFILE_FIELD_ID_TEAM);
        teamName = teamName !== "Unknown" ? ` (Team ${teamName})`: ""
        const fromClause = `${message.user ? userProfile?.display_name: message.username}${teamName}`;

        const blockText = `<${permalink}|Link to message> from ${fromClause} at ${messageDate.toLocaleDateString()}${daysMessage}`;

        block.push(createSectionBlock(blockText));
      }
    })
  );

  return block;
};
