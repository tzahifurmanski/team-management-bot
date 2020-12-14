import { getConversationHistory } from '../integrations/slack/conversations';
import { TEAM_ASK_CHANNEL_ID } from '../integrations/slack/consts';

export interface AsksChannelStatsResult {
  startDateInUTC: string;
  endDateInUTC?: string;
  totalMessages: number;
  totalNumProcessed: number; // Processed message is one that is either done or in progress
  totalNumInProgress: number;
  totalNumUnchecked: number;
  messages: any[];
  messagesInProgress: any[];
  messagesUnchecked: any[];
}

export const getAskChannelStats = async function(
  startingDate: Date,
  endDate?: Date,
): Promise<AsksChannelStatsResult> {
  console.log(
    `Getting ask channels stats between '${startingDate.toUTCString()}' and '${endDate?.toUTCString()}'`,
  );
  const oldestMessage = (startingDate.getTime() / 1000).toString();
  const latestMessage = endDate && (endDate.getTime() / 1000).toString();

  console.log(
    `Getting ask channels stats between '${oldestMessage}' and '${latestMessage}'`,
  );

  const messages = await getConversationHistory(
    TEAM_ASK_CHANNEL_ID,
    oldestMessage,
    latestMessage,
  );

  const unchecked_messages = messages.filter(function(el: any) {
    return (
      !el.reactions ||
      el.reactions.filter(function(reaction: any) {
        return (
          reaction.name === 'white_check_mark' ||
          reaction.name === 'heavy_check_mark' ||
          reaction.name === 'in-progress'
        );
      }).length == 0
    );
  });

  // Go over all unchecked messages and get the permalinks
  const in_progress_messages = messages.filter(function(el: any) {
    return (
      el?.reactions?.filter(function(reaction: any) {
        return reaction.name === 'in-progress';
      }).length > 0
    );
  });

  return {
    startDateInUTC: startingDate.toUTCString(),
    endDateInUTC: endDate?.toUTCString(),
    messages: messages,
    messagesInProgress: in_progress_messages,
    messagesUnchecked: unchecked_messages,
    totalMessages: messages.length,
    totalNumProcessed:
      messages.length - unchecked_messages.length - in_progress_messages.length,
    totalNumInProgress: in_progress_messages.length,
    totalNumUnchecked: unchecked_messages.length,
  };
};
