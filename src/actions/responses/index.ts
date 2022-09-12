import { BotAction } from "../base_action";
import { ReviewRequestResponse } from "./review_request";
import { BugResponse } from "./bug";
import { FolksResponse } from "./folks";
import { MergeResponse } from "./merge";
import { HelpResponse } from "./help";
import { IThinkResponse } from "./i_think";
import { DISABLED_RESPONSES, ENABLE_BOT_RESPONSES } from "../../consts";

const ACTIONS_LIST: BotAction[] = [
  new BugResponse(),
  new FolksResponse(),
  new MergeResponse(),
  new HelpResponse(),
  new IThinkResponse(),
  new ReviewRequestResponse(),
];

// For now most responses are disabled, not sure it's useful ATM
export const RESPONSE_ACTIONS: BotAction[] = [];

if (!ENABLE_BOT_RESPONSES) {
  console.log("** Bot responses are disabled. **");
} else {
  console.log("Bot responses are enabled. Loading responses list...");
  ACTIONS_LIST.forEach((action) => {
    if (
      action.isEnabled() &&
      !DISABLED_RESPONSES.includes(action.constructor.name)
    ) {
      RESPONSE_ACTIONS.push(action);
      console.log(`* '${action.constructor.name}' response is enabled.`);
    } else {
      console.log(`* '${action.constructor.name}' response is skipped.`);
    }
  });
  console.log("Responses list loading is complete.");
}
