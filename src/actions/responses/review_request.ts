import { getRandomFromArray } from "../utils.js";
import { BotAction } from "../base_action.js";
import { botConfig } from "../../settings/server_consts.js";
import { isValueInTeams } from "../../settings/team_utils.js";
import { sendSlackMessage } from "../../integrations/slack/messages.js";

const GIFS = botConfig.RESPONSE_REVIEW_REQUEST_POOL;

// TODO: Add a chaos element (only show gif at X % of the cases)

export class ReviewRequestResponse implements BotAction {
  getHelpText(): string {
    return "Post a funny gif when someone asks for a review";
  }

  isEnabled(): boolean {
    // Only if code reviews channel vars are defined, Load the code review actions
    return isValueInTeams("code_review_channel_id");
  }

  doesMatch(event: any): boolean {
    // TODO: Does this needs to check for the review channel?

    return (
      // TODO: Improve these conditions
      event.text.toLowerCase().includes("https://github.com/snyk") &&
      //   event.text.toLowerCase().includes("/pull/") &&
      //   !event.text.toLowerCase().includes("revert")) ||
      event.text.toLowerCase().includes("review")
    );
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    if (event.thread_ts) {
      // This is a thread, do nothing
      return;
    }

    const gif = getRandomFromArray(GIFS);

    // Reply in a thread
    await sendSlackMessage(slackClient, gif, event.channel, event.ts);
  }
}
