import { BotAction } from "../base_action";
import { removeTimeInfoFromDate } from "../utils";
import { getChannelMessages } from "../../logic/asks_channel";
import {
  getMonitoredChannelStatsForMessages,
  MonitoredChannelStatsResult,
  reportMonitoredChannelStatsToSlack,
} from "../../logic/monitored_channel";
import { BOT_ID } from "../../integrations/slack/consts";

export class MonitoredChannelSummaryStats implements BotAction {
  doesMatch(event: any): boolean {
    // TODO: ask channel summary?
    return event.text.includes(process.env.MONITORED_CHANNEL_TRIGGER);
  }

  async performAction(event: any): Promise<void> {
    // Get the number of days back from event.text. Default is 0 (this day)
    // Added 1 as default so I can reduce the user input by 1 (because day 0 is the first day)

    // TODO: Make this prettier - This is needed because we need to count for a scenario where the text starts with @unibot so we needs to exclude it
    const numOfDays =
      (event.text.replace(`<@${BOT_ID}> `, "").split(" ")[
        process.env.MONITORED_CHANNEL_DAYS_INDEX || 0
      ] || 1) - 1;
    const startingDate = new Date();
    startingDate.setDate(startingDate.getDate() - numOfDays);
    removeTimeInfoFromDate(startingDate);

    const endingDate = new Date();

    const messages: any[any] = await getChannelMessages(
      startingDate,
      endingDate,
      process.env.MONITORED_CHANNEL_ID
    );

    const stats: MonitoredChannelStatsResult = await getMonitoredChannelStatsForMessages(
      process.env.MONITORED_CHANNEL_ID || "",
      messages,
      startingDate.toUTCString(),
      endingDate.toUTCString(),
      process.env.MONITORED_CHANNEL_CONDITION_USERNAME,
      process.env.MONITORED_CHANNEL_CONDITION_MESSAGE_SUCCESS,
      process.env.MONITORED_CHANNEL_CONDITION_MESSAGE_FAILURE
    );

    await reportMonitoredChannelStatsToSlack(
      stats,
      event.channel,
      event.thread_ts
    );
  }
}
