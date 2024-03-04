import { BotAction } from "../base_action";
import { Compliment } from "./compliment";
import { IntroduceYourself } from "./introduce_yourself";
import { AskChannelStatusStatsOrSummary } from "./ask_channel_status_stats_or_summary";
import { MeaningOfLife } from "./meaning_of_life";
import { GroupAskChannelMonthlyStats } from "./group_ask_channel_monthly_stats";
import { MonitoredChannelSummaryStats } from "./monitored_channel_stats";
import { AskChannelStatusForYesterday } from "./ask_channel_status_for_yesterday";
import { ZendeskTicketsStatus } from "./zendesk_tickets_status";
import { Help } from "./help";
import { Status } from "./status";
import { logger } from "../../settings/server_consts";

const helpCommand = new Help();
const ACTIONS_LIST: BotAction[] = [
  new AskChannelStatusForYesterday(),
  new AskChannelStatusStatsOrSummary(),
  new GroupAskChannelMonthlyStats(),
  new ZendeskTicketsStatus(),
  new MonitoredChannelSummaryStats(),
  new Compliment(),
  new MeaningOfLife(),
  new Status(),
  helpCommand,
  new IntroduceYourself(helpCommand),
];

export const ASKS_ACTIONS: BotAction[] = [];

logger.info("Loading actions list...");
ACTIONS_LIST.forEach((action) => {
  if (action.isEnabled()) {
    ASKS_ACTIONS.push(action);
    logger.info(`* '${action.constructor.name}' action is enabled.`);
  } else {
    logger.info(`* '${action.constructor.name}' action is skipped.`);
  }
});
logger.info("Actions list loading is complete.");

helpCommand.setActionsList(ASKS_ACTIONS);
