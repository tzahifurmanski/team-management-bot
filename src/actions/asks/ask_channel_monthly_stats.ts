import { BotAction } from "../base_action";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsBuckets,
  reportStatsToSlack,
} from "../../logic/asks_channel";
import { BOT_ID } from "../../integrations/slack/consts";
import {sanitizeCommandInput} from "../../integrations/slack/utils";

export class AskChannelMonthlyStats implements BotAction {
  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith("ask channel monthly stats");
  }

  async performAction(event: any): Promise<void> {
    // Get the number of weeks back from event.text. Default is 0 (Beginning of this month).
    // Added 1 as default so I can reduce the user input by 1 (because week 0 is the first month)
    // TODO: Make this prettier - This is needed because we need to count for a scenario where the text starts with @unibot so we needs to exclude it
    const numOfMonths =
      (event.text.replace(`<@${BOT_ID}> `, "").split(" ")[4] || 1) - 1;

    // Get the timeframe for the beginning of the month
    const date = new Date();
    const startingDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth() - numOfMonths, 1, 0)
    );

    // Create a list of channels to get stats on

    const messages: any[any] = await getChannelMessages(startingDate);

    const statsArray: AsksChannelStatsResult[] = await getStatsBuckets(
      messages,
      "month"
    );

    // TODO: Add a counter to how many bulk we had.
    for (const stats of statsArray) {
      console.log(
        `Currently processing block for ${stats.startDateInUTC} to ${stats.endDateInUTC}...`
      );
      await reportStatsToSlack(stats, event.channel, event.thread_ts);
    }
  }
}
