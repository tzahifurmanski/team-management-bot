import { BotAction } from "../base_action";
import {
  BOT_ID,
  GROUP_ASK_CHANNELS_LIST,
} from "../../integrations/slack/consts";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsBuckets,
  reportStatsToSlack,
} from "../../logic/asks_channel";

export class GroupAskChannelMonthlyStats implements BotAction {
  getHelpText(): string {
    return "`group ask channel stats` - Get statistics about what goes on in your department (default for 7 days). You can provide number of days / weeks / months (For example: `group ask channel stats 15 days`, `group ask channel stats 2 weeks`)";
  }

  isEnabled(): boolean {
    // Available only if there are multiple group ask channels defined
    return !!GROUP_ASK_CHANNELS_LIST && GROUP_ASK_CHANNELS_LIST.size > 0;
  }

  doesMatch(event: any): boolean {
    return event.text.includes("group ask channel stats");
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    // TODO: Start using getStartingDate here. Need to first refactor getStartingDate to dynamically get indexes for where the days / metric are in the word

    // Get the number of months back from event.text. Default is 0 (Beginning of this month).
    // Added 1 as default so I can reduce the user input by 1 (because week 0 is the first month)
    // TODO: Make this prettier - This is needed because we need to count for a scenario where the text starts with @unibot so we needs to exclude it
    const numOfMonths =
      (event.text.replace(`<@${BOT_ID}> `, "").split(" ")[5] || 1) - 1;

    // Get the timeframe for the beginning of the month
    const date = new Date();
    const startingDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth() - numOfMonths, 1, 0)
    );

    for (const [channelName, channelId] of GROUP_ASK_CHANNELS_LIST.entries()) {
      console.log(`Processing channel '${channelName}' and id '${channelId}'`);

      const messages: any[any] = await getChannelMessages(
        slackClient,
        startingDate,
        undefined,
        channelId
      );

      const statsArray: AsksChannelStatsResult[] = await getStatsBuckets(
        messages,
        "month",
        channelId
      );

      // TODO: Add a counter to how many bulk we had.
      for (const stats of statsArray) {
        console.log(
          `Currently processing block for ${stats.startDateInUTC} to ${stats.endDateInUTC}...`
        );
        await reportStatsToSlack(
          slackClient,
          stats,
          event.channel,
          event.thread_ts,
          false
        );
      }
    }
  }
}
