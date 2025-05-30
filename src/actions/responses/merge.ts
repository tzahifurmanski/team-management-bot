import { getRandomFromArray } from "../utils.js";
import { BotAction } from "../base_action.js";
import { botConfig } from "../../settings/server_consts.js";
import { sendSlackMessage } from "../../integrations/slack/messages.js";

const GIFS = botConfig.RESPONSE_MERGE_POOL;

// TODO: Add a chaos element (only show gif at X % of the cases)

export class MergeResponse implements BotAction {
  getHelpText(): string {
    return "Post a funny gif when a PR is being merged";
  }

  isEnabled(): boolean {
    // This action should always be available
    return true;
  }

  doesMatch(event: any): boolean {
    return (
      event.bot_profile?.name === "GitHub" &&
      event.attachments?.length > 0 &&
      event.attachments[0].pretext.startsWith("Pull request merged")
    );
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    if (event.thread_ts) {
      // This is a thread, do nothing. Not sure if I need it
      return;
    }
    const gif = getRandomFromArray(GIFS);

    // Reply in a thread
    await sendSlackMessage(slackClient, gif, event.channel, event.ts);
  }
}
