import {
  createBlock,
  getMessagePermalink,
} from "../../integrations/slack/messages";
import { BotAction } from "../base_action";
import { removeTimeInfoFromDate, setDateToSunday, toDateTime } from "../utils";
import { TEAM_ASK_CHANNEL_ID } from "../../integrations/slack/consts";
import {
  AsksChannelStatsResult,
  getAskChannelMessages,
  getStatsBuckets,
  reportStatsToSlack,
} from "../../logic/asks_channel";

const { sendSlackMessage } = require("../../integrations/slack/messages");

export class AskChannelMonthlyStats implements BotAction {
  doesMatch(event: any): boolean {
    // TODO: ask channel weekly?
    return event.text.includes("ask channel monthly stats");
  }

  async performAction(event: any): Promise<void> {
    // Get the number of weeks back from event.text. Default is 0 (Beginning of this month).
    // Added 1 as default so I can reduce the user input by 1 (because week 0 is the first month)
    const numOfMonths = (event.text.split(" ")[4] || 1) - 1;

    // Get the timeframe for the beginning of the month
    const date = new Date();
    const startingDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth() - numOfMonths, 1, 0)
    );

    // TODO: THIS IS NOT GOOD
    console.log("Monthly - ", startingDate.toUTCString());
    // removeTimeInfoFromDate(startingDate);

    const messages: any[any] = await getAskChannelMessages(startingDate);

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
