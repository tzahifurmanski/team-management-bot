import { getRandomFromArray } from "../utils";
import { BotAction } from "../base_action";
import {botConfig} from "../../consts";
import {TEAM_CODE_REVIEW_CHANNEL_ID} from "../../integrations/slack/consts";

const { sendSlackMessage } = require("../../integrations/slack/messages");

const GIFS = botConfig.RESPONSE_REVIEW_REQUEST_POOL;

// TODO: Add a chaos element (only show gif at X % of the cases)

export class ReviewRequestResponse implements BotAction {
  getHelpText(): string {
    return "Post a funny gif when someone asks for a review";
  }

  isEnabled(): boolean {
    // Only if code reviews channel vars are defined, Load the code review actions
    return !!(TEAM_CODE_REVIEW_CHANNEL_ID);
  }

  doesMatch(event: any): boolean {
    return (
        // TODO: Improve these conditions
      event.text.toLowerCase().includes("https://github.com/snyk") &&
      //   event.text.toLowerCase().includes("/pull/") &&
      //   !event.text.toLowerCase().includes("revert")) ||
      event.text.toLowerCase().includes("review")
    );
  }

  async performAction(event: any): Promise<void> {
    if (event.thread_ts) {
      // This is a thread, do nothing
      return;
    }

    const gif = getRandomFromArray(GIFS);

    // Reply in a thread
    await sendSlackMessage(gif, event.channel, event.ts);
  }
}
