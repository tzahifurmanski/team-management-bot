import { createBlock, getMessagePermalink } from '../../integrations/slack/messages';
import { BotAction } from '../base_action';
import { removeTimeInfoFromDate, setDateToSunday, toDateTime } from '../utils';
import { TEAM_ASK_CHANNEL_ID } from '../../integrations/slack/consts';
import { AsksChannelStatsResult, getAskChannelStats } from '../../logic/asks_channel';

const { sendSlackMessage } = require('../../integrations/slack/messages');

export class AskChannelStats implements BotAction {
  doesMatch(event: any): boolean {
    return event.text.includes('ask channel stats');
  }

  async performAction(event: any): Promise<void> {
    // TODO: Pass the number of days back to go via the event text. Right now taking a week back

    // Set the starting date to be Sunday of this week
    const startingDate = setDateToSunday(new Date());
    // startingDate.setDate(startingDate.getDate() - 7);
    removeTimeInfoFromDate(startingDate);

    const stats: AsksChannelStatsResult = await getAskChannelStats(
      startingDate,
    );

    await sendSlackMessage(
      `<#${TEAM_ASK_CHANNEL_ID}> had a *total of ${stats.totalMessages} messages* since ${stats.startDateInUTC}.\nOut of those, *${stats.totalNumProcessed} were handled*, *${stats.totalNumInProgress} are in progress* and *${stats.totalNumUnchecked} were not handled*.`,
      event.channel,
      event.thread_ts,
    );

    if (stats.totalNumProcessed > 0) {
      const in_progress_blocks: string[] = await getPermalinkBlocks(
        stats.messagesInProgress,
      );

      // TODO: Add a text block?
      await sendSlackMessage(
        `These are the in progress asks we currently have:`,
        event.channel,
        event.thread_ts,
        in_progress_blocks,
      );
    }

    if (stats.totalNumUnchecked > 0) {
      const unchecked_blocks: string[] = await getPermalinkBlocks(
        stats.messagesUnchecked,
      );

      // TODO: Add a text block?
      await sendSlackMessage(
        `These are the open asks we currently have:`,
        event.channel,
        event.thread_ts,
        unchecked_blocks,
      );
    }
  }
}

// This method gets a list of messages and creates a permalink string for displaying the message.
const getPermalinkBlocks = async function(messages: any[]): Promise<string[]> {
  const block: string[] = [];

  await Promise.all(
    messages.map(async (message: any) => {
      let permalink = await getMessagePermalink(
        TEAM_ASK_CHANNEL_ID,
        message.ts,
      );
      if (permalink) {
        block.push(
          createBlock(
            `<${permalink}|Link to message> from <@${
              message.user
            }> at ${toDateTime(message.ts).toLocaleDateString()}`,
          ),
        );
      }
    }),
  );

  return block;
};
