import { BotAction } from "../base_action";
import {TEAM_CODE_REVIEW_CHANNEL_ID} from "../../integrations/slack/consts";
import {ReviewRequestResponse} from "./review_request";
// import { BugResponse } from "./bug";
// import { FolksResponse } from "./folks";
// import { MergeResponse } from "./merge";
// import { HelpResponse } from "./help";
// import { IThinkResponse } from "./i_think";

// For now disable responses, we'll have to see if that's useful
export const RESPONSE_ACTIONS: BotAction[] = [
  // new BugResponse(),
  // new FolksResponse(),
  // new MergeResponse(),
  // new HelpResponse(),
  // new IThinkResponse(),
];

// Only if code reviews channel vars are defined, Load the code review actions
if(TEAM_CODE_REVIEW_CHANNEL_ID) {
    new ReviewRequestResponse()
}