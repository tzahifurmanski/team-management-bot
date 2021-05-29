import { BotAction } from "../base_action";
import { BugResponse } from "./bug";
import { FolksResponse } from "./folks";
import { MergeResponse } from "./merge";
import { HelpResponse } from "./help";
import { IThinkResponse } from "./i_think";

export const RESPONSE_ACTIONS: BotAction[] = [
  new BugResponse(),
  // new ReviewRequestResponse(),
  new FolksResponse(),
  new MergeResponse(),
  new HelpResponse(),
  new IThinkResponse(),
];
