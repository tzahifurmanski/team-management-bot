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
  isEnabled(): boolean {
    // This action should always be available
    return true;
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
