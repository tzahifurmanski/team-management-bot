import { BotAction } from "../base_action";
import {AskChannelStatsParams, getAskChannelStatsParameters, getStartingDate} from "../utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsForMessages,
  reportStatsToSlack,
} from "../../logic/asks_channel";
import { BOT_ID, TEAM_ASK_CHANNEL_ID } from "../../integrations/slack/consts";
import {sanitizeCommandInput, sendGenericError} from "../../integrations/slack/utils";

export class AskChannelStatus implements BotAction {
  getHelpText(): string {
    return "`ask channel status` - Get the status of requests in your team ask channel, for a specific timeframe (defaults for 7 days). You can provide number of days / weeks / months (For example: `ask channel status 15 days`, `ask channel status 2 weeks`).";
  }

  isEnabled(): boolean {
    // This action should be available if there is an asks channel to process
    return !!(TEAM_ASK_CHANNEL_ID);
  }

  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith("ask channel status");
  }

  async performAction(event: any): Promise<void> {
    // Get the timeframe to operate on
    const params: AskChannelStatsParams = getAskChannelStatsParameters(event.text.replace(`<@${BOT_ID}> `, ""));
    if(params.error) {
      console.log(`There was an error processing the stats params for ${event.text} command: ${params.timeMetric}`);
      await sendGenericError(event);
      return;
    }

    const startingDate = getStartingDate(params);
    const endingDate = new Date();
    console.log(`"Date between ${startingDate.toUTCString()} and ${endingDate.toUTCString()}`);

    // Get the stats
    const messages: any[any] = await getChannelMessages(startingDate, endingDate);
    const stats: AsksChannelStatsResult = await getStatsForMessages(
      TEAM_ASK_CHANNEL_ID,
      messages,
      startingDate.toUTCString(),
      endingDate.toUTCString()
    );

    // Report them to Slack
    await reportStatsToSlack(stats, event.channel, event.thread_ts);
  }
}
