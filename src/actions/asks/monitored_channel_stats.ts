import { BotAction } from "../base_action.js";
import { removeTimeInfoFromDate } from "../date_utils.js";
import { getChannelMessages } from "../../logic/asks_channel.js";
import {
  getMonitoredChannelStatsForMessages,
  MonitoredChannelStatsResult,
  reportMonitoredChannelStatsToSlack,
} from "../../logic/monitored_channel.js";
import {
  MONITORED_CHANNEL_CONDITION_MESSAGE_FAILURE,
  MONITORED_CHANNEL_CONDITION_MESSAGE_SUCCESS,
  MONITORED_CHANNEL_CONDITION_USERNAME,
  MONITORED_CHANNEL_DAYS_INDEX,
  MONITORED_CHANNEL_ID,
  MONITORED_CHANNEL_TRIGGER,
  TEAMS_LIST,
} from "../../settings/team_consts.js";
import { BOT_SLACK_ID } from "../../settings/server_consts.js";

export class MonitoredChannelSummaryStats implements BotAction {
  getHelpText(): string {
    return `\`${MONITORED_CHANNEL_TRIGGER}\` - Monitor a certain channel for success/failure messages. For example, can be used to track successful deployments`;
  }

  isEnabled(): boolean {
    return !!(MONITORED_CHANNEL_ID && MONITORED_CHANNEL_TRIGGER);
  }

  doesMatch(event: any): boolean {
    // TODO: ask channel summary?
    return event.text.includes(MONITORED_CHANNEL_TRIGGER);
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    // Get the number of days back from event.text. Default is 0 (this day)
    // Added 1 as default, so I can reduce the user input by 1 (because day 0 is the first day)

    // TODO: Make this prettier - This is needed because we need to count for a scenario where the text starts with @unibot so we needs to exclude it
    const numOfDays =
      (event.text.replace(`<@${BOT_SLACK_ID}> `, "").split(" ")[
        MONITORED_CHANNEL_DAYS_INDEX || 0
      ] || 1) - 1;
    const startingDate = new Date();
    startingDate.setDate(startingDate.getDate() - numOfDays);
    removeTimeInfoFromDate(startingDate);

    const endingDate = new Date();

    const messages: any[any] = await getChannelMessages(
      slackClient,
      MONITORED_CHANNEL_ID,
      TEAMS_LIST.get(MONITORED_CHANNEL_ID)?.allowed_bots || [],
      startingDate,
      endingDate,
    );

    const stats: MonitoredChannelStatsResult =
      await getMonitoredChannelStatsForMessages(
        MONITORED_CHANNEL_ID || "",
        messages,
        startingDate.toUTCString(),
        endingDate.toUTCString(),
        MONITORED_CHANNEL_CONDITION_USERNAME,
        MONITORED_CHANNEL_CONDITION_MESSAGE_SUCCESS,
        MONITORED_CHANNEL_CONDITION_MESSAGE_FAILURE,
      );

    await reportMonitoredChannelStatsToSlack(
      slackClient,
      stats,
      event.channel,
      event.thread_ts,
    );
  }
}
