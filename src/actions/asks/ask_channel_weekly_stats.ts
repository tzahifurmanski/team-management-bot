import { BotAction } from "../base_action";
import {removeTimeInfoFromDate, sanitizeCommandInput, setDateToSunday} from "../utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsBuckets,
  reportStatsToSlack,
} from "../../logic/asks_channel";
import { BOT_ID } from "../../integrations/slack/consts";

export class AskChannelWeeklyStats implements BotAction {
  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith("ask channel weekly stats");
  }

  async performAction(event: any): Promise<void> {
    // Get the number of weeks back from event.text. Default is 0 (Beginning of this week).
    // Added 1 as default so I can reduce the user input by 1 (because week 0 is the first week)
    // TODO: Make this prettier - This is needed because we need to count for a scenario where the text starts with @unibot so we needs to exclude it
    const numOfWeeks =
      (event.text.replace(`<@${BOT_ID}> `, "").split(" ")[4] || 1) - 1;

    const startingDate = setDateToSunday(new Date());
    startingDate.setDate(startingDate.getDate() - 7 * numOfWeeks);
    removeTimeInfoFromDate(startingDate);

    const messages: any[any] = await getChannelMessages(startingDate);

    const statsArray: AsksChannelStatsResult[] = await getStatsBuckets(
      messages,
      "week"
    );

    for (const stats of statsArray) {
      console.log(
        `Currently processing block for ${stats.startDateInUTC} to ${stats.endDateInUTC}...`
      );
      await reportStatsToSlack(stats, event.channel, event.thread_ts);
    }
  }
}
