import { BotAction } from "../base_action";
import { ReviewRequestResponse } from "./review_request";
import { BugResponse } from "./bug";
import { FolksResponse } from "./folks";
import { MergeResponse } from "./merge";
import { HelpResponse } from "./help";
import { IThinkResponse } from "./i_think";
import {
  DISABLED_RESPONSES,
  ENABLE_BOT_RESPONSES,
  logger,
} from "../../settings/server_consts";

const ACTIONS_LIST: BotAction[] = [
  new BugResponse(),
  new FolksResponse(),
  new MergeResponse(),
  new HelpResponse(),
  new IThinkResponse(),
  new ReviewRequestResponse(),
];

export const RESPONSE_ACTIONS: BotAction[] = [];

if (!ENABLE_BOT_RESPONSES) {
  logger.info("** Bot responses are disabled. **");
} else {
  logger.info("Bot responses are enabled. Loading responses list...");
  ACTIONS_LIST.forEach((action) => {
    if (
      action.isEnabled() &&
      !DISABLED_RESPONSES.includes(action.constructor.name)
    ) {
      RESPONSE_ACTIONS.push(action);
      logger.info(`* '${action.constructor.name}' response is enabled.`);
    } else {
      logger.info(`* '${action.constructor.name}' response is skipped.`);
    }
  });
  logger.info("Responses list loading is complete.");
}
