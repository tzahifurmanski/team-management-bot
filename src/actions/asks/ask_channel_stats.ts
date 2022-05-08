import { BotAction } from "../base_action";
import {AskChannelStatsParams, getAskChannelStatsParameters, getStartingDate, removeTimeInfoFromDate} from "../utils";
import {
  AsksChannelStatsResult,
  getChannelMessages,
  getStatsForMessages,
  reportStatsToSlack,
} from "../../logic/asks_channel";
import { BOT_ID, TEAM_ASK_CHANNEL_ID } from "../../integrations/slack/consts";
import {sanitizeCommandInput} from "../../integrations/slack/utils";

export class AskChannelStats implements BotAction {
  getHelpText(): string {
    return "Get you some stats about what goes on in your team channel (`ask channel stats`, default for 7 days). You can provide number of days / weeks / months (`ask channel stats 15 days`, `ask channel stats 2 weeks`)\n";
  }

  isEnabled(): boolean {
    // This action should be available if there is an asks channel to process
    return !!(TEAM_ASK_CHANNEL_ID);
  }

  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith("ask channel stats");
  }

  async performAction(event: any): Promise<void> {
    // Get the starting date
    const params: AskChannelStatsParams = getAskChannelStatsParameters(event.text.replace(`<@${BOT_ID}> `, ""));
    const startingDate = getStartingDate(params);

    const endingDate = new Date();

    console.log(`"Date between ${startingDate.toUTCString()} and ${endingDate.toUTCString()}`);

    const messages: any[any] = await getChannelMessages(startingDate, endingDate);

    const stats: AsksChannelStatsResult = await getStatsForMessages(
      TEAM_ASK_CHANNEL_ID,
      messages,
      startingDate.toUTCString(),
      endingDate.toUTCString()
    );

    await reportStatsToSlack(stats, event.channel, event.thread_ts);
  }
}
