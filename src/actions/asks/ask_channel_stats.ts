import { BotAction } from "../base_action";
import {removeTimeInfoFromDate} from "../utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsForMessages,
  reportStatsToSlack,
} from "../../logic/asks_channel";
import { BOT_ID, TEAM_ASK_CHANNEL_ID } from "../../integrations/slack/consts";
import {sanitizeCommandInput} from "../../integrations/slack/utils";

export class AskChannelSummaryStats implements BotAction {
  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith("ask channel stats");
  }

  async performAction(event: any): Promise<void> {
    // Get the number of days back from event.text. Default is 7 (Beginning of the previous week back)
    // TODO: Make this prettier - This is needed because we need to count for a scenario where the text starts with @unibot so we needs to exclude it
    const numOfDays =
      event.text.replace(`<@${BOT_ID}> `, "").split(" ")[3] || 7;

    const startingDate = new Date(
      new Date().getTime() - numOfDays * 24 * 60 * 60 * 1000
    );
    removeTimeInfoFromDate(startingDate);
    const endingDate = new Date();

    const messages: any[any] = await getChannelMessages(
      startingDate,
      endingDate
    );

    const stats: AsksChannelStatsResult = await getStatsForMessages(
      TEAM_ASK_CHANNEL_ID,
      messages,
      startingDate.toUTCString(),
      endingDate.toUTCString()
    );

    await reportStatsToSlack(stats, event.channel, event.thread_ts);
  }
}
