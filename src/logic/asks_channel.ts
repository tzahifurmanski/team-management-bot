import { getConversationHistory } from "../integrations/slack/conversations.js";
import { USER_PROFILE_FIELD_ID_TEAM } from "../settings/team_consts.js";
import {
  createDivider,
  createImageBlock,
  createSectionBlock,
  getMessagePermalink,
  sendSlackMessage,
} from "../integrations/slack/messages.js";
import {
  removeTimeInfoFromDate,
  setDateToSunday,
  toDateTime,
} from "../actions/date_utils.js";
import { SectionBlock } from "@slack/web-api";
import { getUserProfile } from "../integrations/slack/users.js";
import { getValueFromProfile } from "../integrations/slack/utils.js";
import { Block } from "@slack/types";
import {
  AsksChannelReportResult,
  createReport,
  createReportSection,
} from "./ask_channel_reporting.js";
import {
  logger,
  REACTIONS_HANDLED,
  REACTIONS_IN_PROGRESS,
} from "../settings/server_consts.js";

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
export const getChannelMessages = async (
  slackClient: any,
  askChannelId: string,
  allowed_bots: string[],
  startingDate: Date,
  endDate?: Date,
): Promise<any[any]> => {
  logger.trace(
    `Getting ask channels messages between '${startingDate.toUTCString()}' and '${endDate?.toUTCString()}'`,
  );
  const oldestMessage = (startingDate.getTime() / 1000).toString();
  const latestMessage = endDate && (endDate.getTime() / 1000).toString();

  logger.trace(`Timeframe between '${oldestMessage}' and '${latestMessage}'`);

  return await getConversationHistory(
    slackClient,
    askChannelId,
    allowed_bots,
    oldestMessage,
    latestMessage,
  );
};

// This method gets a list of messages and a timeframe and returns stats on these messages
export const getStatsForMessages = (
  channelId: string,
  messages: any,
  startDateInUTC: string,
  endDateInUTC?: string,
): AsksChannelStatsResult => {
  const messagesUnchecked = messages.filter((el: any) => {
    return (
      !el.reactions ||
      el.reactions.filter((reaction: any) => {
        return [...REACTIONS_IN_PROGRESS, ...REACTIONS_HANDLED].includes(
          reaction.name,
        );
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
  if (type === "weeks") {
    // Build the starting and end dates for the bucket
    const weekStartDate = new Date(messageDate.getTime());
    setDateToSunday(weekStartDate);
    removeTimeInfoFromDate(weekStartDate);

    const weekEndDate = new Date(weekStartDate.getTime() - 1);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    return [weekStartDate, weekEndDate];
  } else if (type === "months") {
    const dayStartDate = new Date(
      Date.UTC(messageDate.getFullYear(), messageDate.getMonth(), 1),
    );

    const tempDate = new Date(
      Date.UTC(messageDate.getFullYear(), messageDate.getMonth() + 1, 1),
    );
    const dayEndDate = new Date(tempDate.getTime() - 1);

    return [dayStartDate, dayEndDate];
  } else if (type === "days") {
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
  type: string, // This can either be 'days', 'weeks', or 'months'. This is the variable by which we're going to 'group by' the buckets
  channelId: string,
): Promise<AsksChannelStatsResult[]> => {
  const buckets = new Map<string, any[]>();
  const bucketsRanges: any = {};

  messages.map(async (message: any) => {
    // Check the date on the message
    const messageDate: Date = toDateTime(message.ts);

    const [bucketStartDate, bucketEndDate] = getBucketRange(messageDate, type);
    bucketsRanges[bucketStartDate.toUTCString()] = bucketEndDate.toUTCString();

    logger.debug(
      `For message ${messageDate.toUTCString()} we got bucket range of ${bucketStartDate} to ${bucketEndDate}`,
    );

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
      bucketsRanges[key],
    );
    results.push(stats);
  }

  // Sort the results by start time
  results.sort(function (a, b) {
    // @ts-ignore
    return new Date(b.startDateInUTC) - new Date(a.startDateInUTC);
  });

  return results;
};

export const reportStatsToSlack = async (
  slackClient: any,
  stats: AsksChannelStatsResult,
  destinationChannel: any,
  destinationThreadTS: any,
  includeSummary = true,
  includeAsks = true,
  includeReport = false,
) => {
  logger.debug("Time in utc - start", stats.startDateInUTC);
  logger.debug("Time in utc - end", stats.endDateInUTC);

  const messageBlocks: Block[] = [];

  if (includeSummary) {
    const text = `<#${stats.channelId}> had a *total of ${stats.totalMessages} messages* between ${stats.startDateInUTC} and ${stats.endDateInUTC}.\nOut of those, *${stats.totalNumProcessed} were handled*, *${stats.totalNumInProgress} are in progress* and *${stats.totalNumUnchecked} were not handled*.`;
    messageBlocks.push(createSectionBlock(text));
  }

  if (includeAsks && stats.totalMessages > 0) {
    if (stats.totalNumInProgress > 0) {
      messageBlocks.push(
        createSectionBlock("These are the *In Progress* asks:"),
      );

      messageBlocks.push(
        ...(await getPermalinkBlocks(
          slackClient,
          stats.channelId,
          stats.messagesInProgress,
        )),
      );
    }

    if (stats.totalNumUnchecked > 0) {
      messageBlocks.push(
        createSectionBlock("These are the *Not Handled* asks:"),
      );
      messageBlocks.push(
        ...(await getPermalinkBlocks(
          slackClient,
          stats.channelId,
          stats.messagesUnchecked,
        )),
      );
    }
  }

  // Post the messages info
  if (messageBlocks.length > 0) {
    await sendSlackMessage(
      slackClient,
      `<#${stats.channelId}> had a *total of ${stats.totalMessages} messages* between ${stats.startDateInUTC} and ${stats.endDateInUTC}.\nOut of those, *${stats.totalNumProcessed} were handled*, *${stats.totalNumInProgress} are in progress* and *${stats.totalNumUnchecked} were not handled*.`,
      destinationChannel,
      destinationThreadTS,
      messageBlocks,
      true,
    );
  }

  const reportMessageBlocks: Block[] = [];

  if (includeReport && stats.totalMessages > 0) {
    const results: AsksChannelReportResult = await createReport(
      slackClient,
      stats.messages,
    );

    reportMessageBlocks.push(
      createSectionBlock(
        `Between ${stats.startDateInUTC} and ${stats.endDateInUTC}:`,
      ),
    );
    reportMessageBlocks.push(
      ...createReportSection(results.statsByTeam, "Team"),
    );
    reportMessageBlocks.push(createDivider());
    reportMessageBlocks.push(
      ...createReportSection(results.statsByDivision, "Division"),
    );
    reportMessageBlocks.push(createDivider());
    reportMessageBlocks.push(
      ...createReportSection(results.statsByDepartment, "Department"),
    );
  }

  if (reportMessageBlocks.length > 0) {
    await sendSlackMessage(
      slackClient,
      `Asks origin report`,
      destinationChannel,
      destinationThreadTS,
      reportMessageBlocks,
    );
  }
};

export const reportChartToSlack = async (
  slackClient: any,
  statsArray: AsksChannelStatsResult[],
  destinationChannel: any,
  destinationThreadTS: any,
) => {
  const chart: any = {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Total",
          data: [],
        },
      ],
    },
    options: {
      plugins: {
        datalabels: {
          anchor: "end",
          align: "top",
          color: "#fff",
          backgroundColor: "rgba(34, 139, 34, 0.6)",
          borderColor: "rgba(34, 139, 34, 1.0)",
          borderRadius: 10,
        },
      },
    },
  };

  for (const stats of statsArray.reverse()) {
    chart.data.labels.push(new Date(stats.startDateInUTC).toDateString());
    chart.data.datasets[0].data.push(stats.totalMessages);
  }
  const encodedChart = encodeURIComponent(JSON.stringify(chart));
  const chartImageURL = `https://quickchart.io/chart?c=${encodedChart}`;

  await sendSlackMessage(
    slackClient,
    `Asks origin report`,
    destinationChannel,
    destinationThreadTS,
    [createImageBlock("Asks Distribution", chartImageURL, "Asks Distribution")],
  );
};

// This method gets a list of messages and creates a permalink string for displaying the message.
const getPermalinkBlocks = async (
  slackClient: any,
  channelId: string,
  messages: any[],
): Promise<SectionBlock[]> => {
  const block: SectionBlock[] = [];
  const dateToday = new Date();

  await Promise.all(
    messages.map(async (message: any) => {
      const permalink = await getMessagePermalink(
        slackClient,
        channelId,
        message.ts,
      );
      if (permalink) {
        const messageDate = toDateTime(message.ts);
        const daysDifference = Math.round(
          (dateToday.getTime() - messageDate.getTime()) / (1000 * 3600 * 24),
        );
        const daysMessage =
          daysDifference === 0
            ? " (earlier today)"
            : daysDifference === 1
              ? " (1 day ago)"
              : ` (${daysDifference} days ago)`;

        // TODO: Maybe only display the team name, when doing 'ask channel stats', and not when showing the stats for yesterday. Requires refactor.
        const userProfile =
          (await getUserProfile(slackClient, message.user)) || {};

        let teamName = getValueFromProfile(
          userProfile,
          USER_PROFILE_FIELD_ID_TEAM,
        );
        teamName = teamName !== "Unknown" ? ` (Team ${teamName})` : "";
        const fromClause = `${
          message.user
            ? userProfile?.display_name || userProfile?.real_name
            : message.username
        }${teamName}`;

        const blockText = `<${permalink}|Link to ask> from ${fromClause} at ${messageDate.toLocaleDateString()}${daysMessage}`;

        block.push(createSectionBlock(blockText));
      }
    }),
  );

  return block;
};
