import { BotAction } from "../base_action";
import { Compliment } from "./compliment";
import { IntroduceYourself } from "./introduce_yourself";
import { AskChannelStatusStatsOrSummary } from "./ask_channel_status_stats_or_summary";
import { MeaningOfLife } from "./meaning_of_life";
import { GroupAskChannelMonthlyStats } from "./group_ask_channel_monthly_stats";
import { MonitoredChannelSummaryStats } from "./monitored_channel_stats";
import { AskChannelStatusForYesterday } from "./ask_channel_status_for_yesterday";
import { OncallTicketsStatus } from "./oncall_tickets_status";
import { Help } from "./help";
import { Status } from "./status";

const helpCommand = new Help();
const ACTIONS_LIST: BotAction[] = [
  new AskChannelStatusForYesterday(),
  new AskChannelStatusStatsOrSummary(),
  new GroupAskChannelMonthlyStats(),
  new OncallTicketsStatus(),
  new MonitoredChannelSummaryStats(),
  new Compliment(),
  new MeaningOfLife(),
  new Status(),
  helpCommand,
  new IntroduceYourself(),
];

export const ASKS_ACTIONS: BotAction[] = [];

console.log("Loading actions list...");
ACTIONS_LIST.forEach((action) => {
  if (action.isEnabled()) {
    ASKS_ACTIONS.push(action);
    console.log(`* '${action.constructor.name}' action is enabled.`);
  } else {
    console.log(`* '${action.constructor.name}' action is skipped.`);
  }
});
console.log("Actions list loading is complete.");

helpCommand.setActionsList(ASKS_ACTIONS);
