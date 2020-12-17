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

export class AskChannelDailyStats implements BotAction {
  doesMatch(event: any): boolean {
    // TODO: ask channel daily?
    return event.text.includes("ask channel daily stats");
  }

  async performAction(event: any): Promise<void> {
    // Get the number of days back from event.text. Default is 0 (this day)
    // Added 1 as default so I can reduce the user input by 1 (because day 0 is the first day)
    const numOfDays = (event.text.split(" ")[4] || 1) - 1;

    const startingDate = new Date();
    startingDate.setDate(startingDate.getDate() - numOfDays);
    removeTimeInfoFromDate(startingDate);

    const messages: any[any] = await getAskChannelMessages(startingDate);

    const statsArray: AsksChannelStatsResult[] = await getStatsBuckets(
      messages,
      "day"
    );

    // Group the messages by buckets - one bucket for each
    for (const stats of statsArray) {
      console.log(
        `Currently processing block for ${stats.startDateInUTC} to ${stats.endDateInUTC}...`
      );
      await reportStatsToSlack(stats, event.channel, event.thread_ts);
    }
  }
}
