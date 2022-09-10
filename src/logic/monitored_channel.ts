import { sendSlackMessage } from "../integrations/slack/messages";

export interface MonitoredChannelStatsResult {
  startDateInUTC: string;
  endDateInUTC?: string;
  channelId: string;
  totalMessages: number;
  totalNumSuccess?: number; // Processed message is one that is done / accomplished / handled
  totalNumFailure?: number;
  eventEntity?: string;
  messages: any[];
  messagesSuccess?: any[];
  messagesFailure?: any[];
}

// This method gets a list of messages and a timeframe and returns stats on these messages
export const getMonitoredChannelStatsForMessages = (
  channelId: string,
  messages: any,
  startDateInUTC: string,
  endDateInUTC?: string,
  conditionUsername?: string,
  conditionSuccessMessage?: string,
  conditionFailureMessage?: string,
  eventEntity?: string
): MonitoredChannelStatsResult => {
  // Check if no filter conditions were given. If so, skip filtering and return everything.
  if (
    !conditionUsername &&
    !conditionSuccessMessage &&
    !conditionFailureMessage
  ) {
    console.log(
      "No monitored channels stats conditions, so stats grouping is unavailable."
    );

    return {
      eventEntity,
      startDateInUTC,
      endDateInUTC,
      messages,
      totalMessages: messages.length,
      channelId,
    };
  }

  const successMessages = messages.filter((el: any) => {
    return (
      (!conditionUsername || el.username === conditionUsername) &&
      el.attachments?.filter((attachment: any) => {
        return attachment.title?.includes(conditionSuccessMessage);
      }).length > 0
    );
  });

  const failureMessages = messages.filter((el: any) => {
    return (
      el.username === conditionUsername &&
      el.attachments?.filter((attachment: any) => {
        return attachment.title?.includes(conditionFailureMessage);
      }).length > 0
    );
  });

  // Filtering twice as there might be 'noise' messages as well so I'm ignoring those
  // TODO: Do this for the other stats function places as well?
  const totalMessages = successMessages.concat(failureMessages);

  return {
    eventEntity,
    startDateInUTC,
    endDateInUTC,
    messages: totalMessages,
    messagesSuccess: successMessages,
    messagesFailure: failureMessages,
    totalMessages: totalMessages.length,
    totalNumSuccess: successMessages.length,
    totalNumFailure: failureMessages.length,
    channelId,
  };
};

export const reportMonitoredChannelStatsToSlack = async (
  slackClient: any,
  stats: MonitoredChannelStatsResult,
  destinationChannel: any,
  destinationThreadTS: any
) => {
  // console.log("Time in utc - start", stats.startDateInUTC);
  // console.log("Time in utc - end", stats.endDateInUTC);

  await sendSlackMessage(
    slackClient,
    // TODO: Skip the second line if there are no stats.totalNumSuccess and  stats.totalNumFailure
    `<#${stats.channelId}> had a *total of ${stats.totalMessages} ${
      stats.eventEntity ? stats.eventEntity : "events"
    }* between ${stats.startDateInUTC} and ${
      stats.endDateInUTC
    }.\nOut of those, *${stats.totalNumSuccess} were successful*, and *${
      stats.totalNumFailure
    } were failures*.`,
    destinationChannel,
    destinationThreadTS
  );
};
