import { BotAction } from "../base_action";
import {
  extractIDFromChannelString,
  getStatsMessage,
  removeTimeInfoFromDate,
  scheduleCron,
} from "../utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsForMessages,
  reportStatsToSlack,
} from "../../logic/asks_channel";
import {
  SlackWebClient,
  TEAM_ASK_CHANNEL_ID,
  TEAM_ASK_CHANNEL_NAME,
} from "../../integrations/slack/consts";
import { sendSlackMessage } from "../../integrations/slack/messages";
import { sanitizeCommandInput } from "../../integrations/slack/utils";
import { ASK_CHANNEL_STATS_CRON } from "../../consts";
import cronstrue from "cronstrue";

const getChannelNameFromEventText = (eventText: any) => {
  let askChannelId;

  // If there's a sixth word, then it's a channel name
  const params = eventText.split(" ");
  if (params.length === 5) {
    // Take default
    askChannelId = TEAM_ASK_CHANNEL_ID[0];
    console.log(`Using default channel ID ${askChannelId}.`);
  } else {
    askChannelId = extractIDFromChannelString(params[5]);
    console.log(`Found channel ID ${askChannelId}.`);
  }

  return askChannelId;
};

export class AskChannelStatusForYesterday implements BotAction {
  scheduleAskChannelsCrons = () => {
    // Schedule the crons for the ask channels
    if (ASK_CHANNEL_STATS_CRON.length != TEAM_ASK_CHANNEL_ID.length) {
      console.log(
        "ASK_CHANNEL_STATS_CRON and TEAM_ASK_CHANNEL_ID have different lengths, and therefor crons won't be scheduled."
      );
      return;
    }

    // Iterate over the crons and schedule them
    for (let i = 0; i < ASK_CHANNEL_STATS_CRON.length; i++) {
      const eventText = {
        channel: TEAM_ASK_CHANNEL_ID[i],
        thread_ts: "",
        scheduled: true,
        text: `ask channel status for yesterday <#${TEAM_ASK_CHANNEL_ID[i]}|${TEAM_ASK_CHANNEL_NAME[i]}>`,
      };

      // TODO: SlackWebClient is passed 'by value', and when it does, it is empty. Fix this.
      scheduleCron(
        !!ASK_CHANNEL_STATS_CRON[i],
        `update on ${TEAM_ASK_CHANNEL_NAME[i]} channel stats for yesterday`,
        ASK_CHANNEL_STATS_CRON[i],
        this.getAskChannelStatsForYesterday,
        eventText,
        SlackWebClient
      );
    }
  };

  constructor() {
    if (this.isEnabled()) {
      this.scheduleAskChannelsCrons();
    }
  }

  getHelpText(): string {
    let helpMessage =
      "`ask channel status for yesterday` - Get the status of requests in your team ask channel from yesterday and a current status going back for the last 60 days.";
    if (ASK_CHANNEL_STATS_CRON.length > 0) {
      for (let i = 0; i < ASK_CHANNEL_STATS_CRON.length; i++) {
        // If a schedule is set, add it to the help message
        if (ASK_CHANNEL_STATS_CRON[i]) {
          helpMessage += `\n*A recurring ask channel post in <#${
            TEAM_ASK_CHANNEL_ID[i]
          }> is scheduled to be sent ${cronstrue.toString(
            ASK_CHANNEL_STATS_CRON[i]
          )}.*`;
        }
      }
    }
    return helpMessage;
  }

  isEnabled(): boolean {
    // This action should be available if there is an asks channel to process
    return TEAM_ASK_CHANNEL_ID.length > 0;
  }

  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith(
      "ask channel status for yesterday"
    );
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    await this.getAskChannelStatsForYesterday(event, slackClient);
  }

  async getAskChannelStatsForYesterday(
    event: any,
    slackClient: any
  ): Promise<void> {
    if (event.scheduled) {
      console.log(
        "Kicking off a scheduled ask channel stats for yesterday action."
      );
    }

    // TODO: Temporary fix. If client is null, get it again from consts. Remove once I pass it properly during cron scheduling.
    if (!slackClient) {
      console.log("Slack client is null. Getting it again from consts.");
      slackClient = SlackWebClient;
    }

    const askChannelId = getChannelNameFromEventText(event.text);
    if (!askChannelId) {
      console.log(
        `Unable to find channel ID for channel name. Ask: ${event.text}`
      );
      return;
    }

    console.log(
      `Posting the daily asks channel stats summary for channel ${askChannelId}`
    );

    // Set the timeframe range to be yesterday
    const startingDate = new Date();
    startingDate.setDate(startingDate.getDate() - 1);
    removeTimeInfoFromDate(startingDate);

    const tempDate = new Date();
    removeTimeInfoFromDate(tempDate);
    const endingDate = new Date(tempDate.getTime() - 1);
    console.log(
      `timeframe is ${startingDate.toUTCString()} to ${endingDate.toUTCString()}`
    );

    const messages: any[any] = await getChannelMessages(
      slackClient,
      askChannelId,
      startingDate,
      endingDate
    );

    const stats: AsksChannelStatsResult = await getStatsForMessages(
      askChannelId,
      messages,
      startingDate.toUTCString(),
      endingDate.toUTCString()
    );

    const yesterdaySummary = `Good morning team:sunny:\nYesterday, ${getStatsMessage(
      askChannelId,
      stats
    )}`;

    // Say what's the total of open asks we have in the last 60 days
    // =============================================================================

    // Get the timeframe for the last 60 days
    const DAYS_BACK = 60;
    const beginningOfMonthDate = new Date(
      new Date().getTime() - DAYS_BACK * 24 * 60 * 60 * 1000
    );
    removeTimeInfoFromDate(beginningOfMonthDate);
    const now = new Date();

    console.log(
      `${DAYS_BACK} days back timeframe is ${beginningOfMonthDate.toUTCString()} to ${now.toUTCString()}`
    );

    const monthMessages: any[any] = await getChannelMessages(
      slackClient,
      askChannelId,
      beginningOfMonthDate,
      now
    );
    const monthStats: AsksChannelStatsResult = await getStatsForMessages(
      askChannelId,
      monthMessages,
      beginningOfMonthDate.toUTCString(),
      now.toUTCString()
    );
    await sendSlackMessage(
      slackClient,
      `${yesterdaySummary}\nIn the last ${DAYS_BACK} days, ${getStatsMessage(
        askChannelId,
        monthStats
      )}`,
      event.channel,
      event.thread_ts
    );

    // Post the links for the various open stats
    await reportStatsToSlack(
      slackClient,
      monthStats,
      event.channel,
      event.thread_ts,
      false,
      true,
      false
    );
  }
}
