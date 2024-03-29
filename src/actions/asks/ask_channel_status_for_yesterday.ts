import { BotAction } from "../base_action";
import {
  getChannelIDFromEventText,
  getRecurringJobInfo,
  getStatsMessage,
  scheduleAskChannelsCrons,
} from "../utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsForMessages,
  reportStatsToSlack,
} from "../../logic/asks_channel";
import {
  ALLOWED_BOTS_PER_TEAM,
  ASK_CHANNEL_STATS_CRON,
  scheduledMessageLastSent,
  TEAM_ASK_CHANNEL_ID,
  TEAM_ASK_CHANNEL_NAME,
} from "../../settings/team_consts";
import { sendSlackMessage } from "../../integrations/slack/messages";
import { sanitizeCommandInput } from "../../integrations/slack/utils";
import { logger } from "../../settings/server_consts";
import { removeTimeInfoFromDate } from "../date_utils";
import { SlackWebClient } from "../../integrations/slack/consts";

export class AskChannelStatusForYesterday implements BotAction {
  static DAYS_BACK = 60;

  constructor() {
    if (this.isEnabled()) {
      scheduleAskChannelsCrons(
        SlackWebClient,
        ASK_CHANNEL_STATS_CRON,
        TEAM_ASK_CHANNEL_ID,
        TEAM_ASK_CHANNEL_NAME,
        "ask channel status for yesterday",
        this.getAskChannelStatsForYesterday,
      );
    }
  }

  getHelpText(): string {
    let helpMessage =
      "`ask channel status for yesterday` - Get the status of requests in your team ask channel from yesterday and a current status going back for the last " +
      AskChannelStatusForYesterday.DAYS_BACK +
      " days.";

    helpMessage += getRecurringJobInfo(
      "ask channel post",
      ASK_CHANNEL_STATS_CRON,
      TEAM_ASK_CHANNEL_ID,
    );

    return helpMessage;
  }

  isEnabled(): boolean {
    // This action should be available if there is an asks channel to process
    return TEAM_ASK_CHANNEL_ID.length > 0;
  }

  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith(
      "ask channel status for yesterday",
    );
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    await this.getAskChannelStatsForYesterday(event, slackClient);
  }

  async getAskChannelStatsForYesterday(
    event: any,
    slackClient: any,
  ): Promise<void> {
    logger.trace(`Entering 'getAskChannelStatsForYesterday' function.`);

    if (event.scheduled) {
      logger.info(
        "Kicking off a scheduled ask channel stats for yesterday action.",
      );
    }

    // TODO: Temporary fix. If client is null, get it again from consts. Remove once I pass it properly during cron scheduling.
    if (!slackClient) {
      logger.debug("Slack client is null. Getting it again from consts.");
      slackClient = SlackWebClient;
    }

    const askChannelId = getChannelIDFromEventText(
      event.text,
      5,
      TEAM_ASK_CHANNEL_ID[0],
    );

    if (!askChannelId) {
      logger.info(`Unable to find channel ID. Ask: ${event.text}`);
      return;
    }

    // Check if a similar scheduled ask was requested less than a minute ago, and if so, skip
    if (event.scheduled) {
      if (scheduledMessageLastSent.has(askChannelId)) {
        const lastSent = scheduledMessageLastSent.get(askChannelId);
        if (lastSent) {
          const now = new Date();
          const diff = now.getTime() - lastSent.getTime();
          if (diff < 60 * 1000) {
            logger.info(
              `Skipping scheduled ask channel status for yesterday for channel ${askChannelId} as it was requested less than a minute ago.`,
            );
            return;
          }
        }
      }

      // Set now as the last time this was sent
      // TODO: Potential problem - this will show sent even if there was an error and the message was not sent.
      //      Could move it to the end of the function, but then if the time between scheduled requests is short, might not be effective.
      scheduledMessageLastSent.set(askChannelId, new Date());
    }

    logger.info(
      `Posting the daily asks channel stats summary for channel ${askChannelId}`,
    );

    // Set the timeframe range to be yesterday
    const startingDate = new Date();
    startingDate.setDate(startingDate.getDate() - 1);
    removeTimeInfoFromDate(startingDate);

    const tempDate = new Date();
    removeTimeInfoFromDate(tempDate);
    const endingDate = new Date(tempDate.getTime() - 1);
    logger.info(
      `timeframe is ${startingDate.toUTCString()} to ${endingDate.toUTCString()}`,
    );

    const messages: any[any] = await getChannelMessages(
      slackClient,
      askChannelId,
      ALLOWED_BOTS_PER_TEAM.get(askChannelId) || [],
      startingDate,
      endingDate,
    );

    const stats: AsksChannelStatsResult = await getStatsForMessages(
      askChannelId,
      messages,
      startingDate.toUTCString(),
      endingDate.toUTCString(),
    );

    const yesterdaySummary = `Good morning team:sunny:\nYesterday, ${getStatsMessage(
      askChannelId,
      stats,
    )}`;

    // Say what's the total of open asks we have in the last 60 days
    // =============================================================================

    // Get the timeframe for the last 60 days

    const beginningOfMonthDate = new Date(
      new Date().getTime() -
        AskChannelStatusForYesterday.DAYS_BACK * 24 * 60 * 60 * 1000,
    );
    removeTimeInfoFromDate(beginningOfMonthDate);
    const now = new Date();

    logger.info(
      `${
        AskChannelStatusForYesterday.DAYS_BACK
      } days back timeframe is ${beginningOfMonthDate.toUTCString()} to ${now.toUTCString()}`,
    );

    const monthMessages: any[any] = await getChannelMessages(
      slackClient,
      askChannelId,
      ALLOWED_BOTS_PER_TEAM.get(askChannelId) || [],
      beginningOfMonthDate,
      now,
    );
    const monthStats: AsksChannelStatsResult = await getStatsForMessages(
      askChannelId,
      monthMessages,
      beginningOfMonthDate.toUTCString(),
      now.toUTCString(),
    );
    await sendSlackMessage(
      slackClient,
      `${yesterdaySummary}\nIn the last ${
        AskChannelStatusForYesterday.DAYS_BACK
      } days, ${getStatsMessage(askChannelId, monthStats)}`,
      event.channel,
      event.thread_ts,
    );

    // Post the links for the various open stats
    await reportStatsToSlack(
      slackClient,
      monthStats,
      event.channel,
      event.thread_ts,
      false,
      true,
      false,
    );
  }
}
