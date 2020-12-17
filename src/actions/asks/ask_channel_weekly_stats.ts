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

export class AskChannelWeeklyStats implements BotAction {
  doesMatch(event: any): boolean {
    // TODO: ask channel weekly?
    return event.text.includes("ask channel weekly stats");
  }

  async performAction(event: any): Promise<void> {
    // Get the number of weeks back from event.text. Default is 0 (Beginning of this week).
    // Added 1 as default so I can reduce the user input by 1 (because week 0 is the first week)
    const numOfWeeks = (event.text.split(" ")[4] || 1) - 1;

    const startingDate = setDateToSunday(new Date());
    startingDate.setDate(startingDate.getDate() - 7 * numOfWeeks);
    removeTimeInfoFromDate(startingDate);

    const messages: any[any] = await getAskChannelMessages(startingDate);

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
