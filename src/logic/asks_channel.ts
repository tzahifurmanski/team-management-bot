import { getConversationHistory } from '../integrations/slack/conversations';
import { TEAM_ASK_CHANNEL_ID } from '../integrations/slack/consts';
import { createBlock, getMessagePermalink, sendSlackMessage } from '../integrations/slack/messages';
import { removeTimeInfoFromDate, setDateToSunday, toDateTime } from '../actions/utils';
import { SectionBlock } from '@slack/web-api';
import { getUserDisplayName } from '../integrations/slack/users';

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
export const getChannelMessages = async function (
  startingDate: Date,
  endDate?: Date,
  askChannelId: string = TEAM_ASK_CHANNEL_ID
): Promise<any[any]> {
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
export const getStatsForMessages = function (
  channelId: string,
  messages: any,
  startingDateInUTC: string,
  endDateInUTC?: string
): AsksChannelStatsResult {
  const unchecked_messages = messages.filter(function (el: any) {
    return (
      !el.reactions ||
      el.reactions.filter(function (reaction: any) {
        return (
          reaction.name === "white_check_mark" ||
          reaction.name === "heavy_check_mark" ||
          reaction.name === "green_tick" ||
          reaction.name === "in-progress" ||
          reaction.name === "spinner"
        );
      }).length == 0
    );
  });

  // Go over all unchecked messages and get the permalinks
  const in_progress_messages = messages.filter(function (el: any) {
    return (
      el?.reactions?.filter(function (reaction: any) {
        return reaction.name === "in-progress" || reaction.name === "spinner";
      }).length > 0 &&
      el?.reactions.filter(function (reaction: any) {
        return (
          reaction.name === "white_check_mark" ||
          reaction.name === "heavy_check_mark" ||
          reaction.name === "green_tick"
        );
      }).length == 0
    );
  });

  return {
    startDateInUTC: startingDateInUTC,
    endDateInUTC: endDateInUTC,
    messages: messages,
    messagesInProgress: in_progress_messages,
    messagesUnchecked: unchecked_messages,
    totalMessages: messages.length,
    totalNumProcessed:
      messages.length - unchecked_messages.length - in_progress_messages.length,
    totalNumInProgress: in_progress_messages.length,
    totalNumUnchecked: unchecked_messages.length,
    channelId: channelId,
  };
};

export interface AsksChannelWeeklyStatsResult extends AsksChannelStatsResult {}

// TODO: Add a check that if the end date is after now, return now as the end date (as it's irrelevant)
export const getBucketRange = function (
  messageDate: Date,
  type: string
): Date[] {
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

export const getStatsBuckets = async function (
  messages: any[],
  type: string,
  channelId: string = TEAM_ASK_CHANNEL_ID // This can either bet 'week' or 'day'. This is the variable by which we're going to 'group by' the buckets
): Promise<AsksChannelWeeklyStatsResult[]> {
  let buckets = new Map<string, any[]>();
  let bucketsRanges: any = {};

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

  let results: AsksChannelWeeklyStatsResult[] = [];

  // Convert the buckets to a list of stats
  for (let [key, currBucketMessages] of buckets.entries()) {
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

export const reportStatsToSlack = async function (
  stats: AsksChannelStatsResult,
  destinationChannel: any,
  destinationThreadTS: any,
  includeSummary: boolean = true,
  includeDetails: boolean = true
) {
  // console.log("Time in utc - start", stats.startDateInUTC);
  // console.log("Time in utc - end", stats.endDateInUTC);

  // TODO: Send only one message, send all the text in blocks
  const message_blocks: SectionBlock[] = [];

  if (includeSummary) {
    const text = `<#${stats.channelId}> had a *total of ${stats.totalMessages} messages* between ${stats.startDateInUTC} and ${stats.endDateInUTC}.\nOut of those, *${stats.totalNumProcessed} were handled*, *${stats.totalNumInProgress} are in progress* and *${stats.totalNumUnchecked} were not handled*.`;
    message_blocks.push(createBlock(text));
  }

  if (includeDetails) {
    if (stats.totalNumInProgress > 0) {
      message_blocks.push(
        createBlock("These are the in progress asks we currently have:")
      );
      // const in_progress_blocks: SectionBlock[] = [
      //   ,
      // ];
      message_blocks.push(
        ...(await getPermalinkBlocks(stats.channelId, stats.messagesInProgress))
      );
    }

    if (stats.totalNumUnchecked > 0) {
      message_blocks.push(
        createBlock("These are the open asks we currently have:")
      );
      message_blocks.push(
        ...(await getPermalinkBlocks(stats.channelId, stats.messagesUnchecked))
      );
    }
  }

  if (message_blocks.length > 0) {
    // TODO: Maybe text should be empty here?
    await sendSlackMessage(
      `<#${stats.channelId}> had a *total of ${stats.totalMessages} messages* between ${stats.startDateInUTC} and ${stats.endDateInUTC}.\nOut of those, *${stats.totalNumProcessed} were handled*, *${stats.totalNumInProgress} are in progress* and *${stats.totalNumUnchecked} were not handled*.`,
      destinationChannel,
      destinationThreadTS,
      message_blocks,
      true,
    );
  }
};

// This method gets a list of messages and creates a permalink string for displaying the message.
const getPermalinkBlocks = async function (
  channelId: string,
  messages: any[]
): Promise<SectionBlock[]> {
  const block: SectionBlock[] = [];
  const dateToday = new Date();

  await Promise.all(
    messages.map(async (message: any) => {
      let permalink = await getMessagePermalink(channelId, message.ts);
      if (permalink) {
        const messageDate = toDateTime(message.ts);
        const daysDifference = Math.round(
          (dateToday.getTime() - messageDate.getTime()) / (1000 * 3600 * 24)
        );
        const daysMessage =
          daysDifference == 0
            ? " (earlier today)"
            : daysDifference == 1
            ? " (1 day ago)"
            : ` (${daysDifference} days ago)`;
        block.push(
          createBlock(
            `<${permalink}|Link to message> from ${
              message.user
                ? await getUserDisplayName(message.user)
                : message.username
            } at ${messageDate.toLocaleDateString()}${daysMessage}`
          )
        );
      }
    })
  );

  return block;
};
