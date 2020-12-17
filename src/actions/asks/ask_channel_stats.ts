import { BotAction } from "../base_action";
import { removeTimeInfoFromDate, setDateToSunday } from "../utils";
import {
  AsksChannelStatsResult,
  getAskChannelMessages,
  getStatsForMessages,
  reportStatsToSlack,
} from "../../logic/asks_channel";

export class AskChannelSummaryStats implements BotAction {
  doesMatch(event: any): boolean {
    // TODO: ask channel summary?
    return event.text.includes("ask channel stats");
  }

  async performAction(event: any): Promise<void> {
    // Get the number of days back from event.text. Default is 7 (Beginning of the previous week back)
    const numOfDays = event.text.split(" ")[3] || 7;

    const startingDate = setDateToSunday(new Date());
    startingDate.setDate(startingDate.getDate() - numOfDays);
    removeTimeInfoFromDate(startingDate);

    const endingDate = new Date();

    const messages: any[any] = await getAskChannelMessages(
      startingDate,
      endingDate
    );

    const stats: AsksChannelStatsResult = await getStatsForMessages(
      messages,
      startingDate.toUTCString(),
      endingDate.toUTCString()
    );

    await reportStatsToSlack(stats, event.channel, event.thread_ts);
  }
}
