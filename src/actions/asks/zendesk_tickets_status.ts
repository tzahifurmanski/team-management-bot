import { BotAction } from "../base_action";
import {
  createDivider,
  createSectionBlock,
  sendSlackMessage,
} from "../../integrations/slack/messages";
import { getTicketsByView, showView } from "../../integrations/zendesk/views";
import {
  TEAMS_LIST,
  ZENDESK_TICKETS_CHANNEL_ID,
} from "../../settings/team_consts";
import { sanitizeCommandInput } from "../../integrations/slack/utils";
import { logger } from "../../settings/server_consts";
import {
  getChannelIDFromEventText,
  getRecurringJobInfo,
  scheduleAskChannelsCrons,
} from "../utils";
import {
  createAggregateMessage,
  createDetailModeBlocks,
} from "../../logic/zendesk_tickets_utils";
import {
  SlackWebClient,
  ZENDESK_BASE_URL,
  ZENDESK_TOKEN,
} from "../../integrations/consts";
import { findTeamByValue, isValueInTeams } from "../../settings/team_utils";

export class ZendeskTicketsStatus implements BotAction {
  constructor() {
    if (this.isEnabled()) {
      scheduleAskChannelsCrons(
        SlackWebClient,
        Array.from(TEAMS_LIST.values()),
        "zendesk_channel_id",
        "zendesk_channel_name",
        "zendesk_channel_cron",
        "zendesk tickets status",
        this.getZendeskTicketsStatus,
      );
    }
  }

  getHelpText(): string {
    let helpMessage =
      "`zendesk tickets status` - Provide a summary of the current Zendesk tickets currently active for your team.";

    helpMessage += getRecurringJobInfo(
      "zendesk tickets status",
      Array.from(TEAMS_LIST.values()),
      "zendesk_channel_id",
      "zendesk_channel_cron",
    );

    return helpMessage;
  }

  isEnabled(): boolean {
    // const isChannelIdPerName =
    //   ZENDESK_TICKETS_CHANNEL_ID.length === ZENDESK_TICKETS_CHANNEL_NAME.length;
    const isZendeskSetup = !!(ZENDESK_BASE_URL && ZENDESK_TOKEN);
    const isZendeskChannel = isValueInTeams("zendesk_channel_id");

    // TODO: These checks need to be when loading the data into teams, not here
    // const isViewPerChannel =
    //   ZENDESK_MONITORED_VIEW.length === ZENDESK_TICKETS_CHANNEL_ID.length;

    // Check if we got any aggregated keys, or none at all
    // const isAggregateKeyPerView =
    //   ZENDESK_VIEW_AGGREGATED_FIELD_ID.length === 0 ||
    //   ZENDESK_VIEW_AGGREGATED_FIELD_ID.length === ZENDESK_MONITORED_VIEW.length;

    logger.trace(
      "Conditions:",
      // isChannelIdPerName,
      isZendeskSetup,
      isZendeskChannel,
      // isViewPerChannel,
      // isAggregateKeyPerView,
    );

    return (
      // isChannelIdPerName &&
      isZendeskSetup &&
      isZendeskChannel
      // isViewPerChannel &&
      // isAggregateKeyPerView
    );
  }

  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith(
      "zendesk tickets status",
    );
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    await this.getZendeskTicketsStatus(event, slackClient);
  }

  // Supports two modes -
  // Details mode, and aggregated mode. If aggregated ID is supplied, we're in aggregated mode.

  async getZendeskTicketsStatus(event: any, slackClient: any): Promise<void> {
    if (event.scheduled) {
      logger.info("Kicking off a scheduled zendesk tickets status action.");
    }

    // TODO: Temporary fix. If client is null, get it again from consts.
    if (!slackClient) {
      logger.info("Slack client is null. Getting it again from consts.");
      slackClient = SlackWebClient;
    }

    const askChannelId = getChannelIDFromEventText(
      event.text,
      3,
      ZENDESK_TICKETS_CHANNEL_ID[0],
    );

    const team = findTeamByValue(askChannelId, "ask_channel_id");

    if (!team) {
      logger.error(
        `Unable to find team for channel ID ${askChannelId}. Ask: ${event.text}`,
      );
      return;
    }
    // TODO: Prevent this from running twice, like we did for ask_channel_status_for_yesterday.ts

    logger.info(
      `Running zendesk tickets status for channel ${team.zendesk_channel_id}`,
    );

    logger.info(
      `Using view ID ${team.zendesk_monitored_view_id} for reporting in channel ${team.zendesk_channel_id}.`,
    );

    const viewData: any = await showView(team.zendesk_monitored_view_id);

    const tickets: any[] = await getTicketsByView(team.zendesk_monitored_view_id);

    // Check if we need to filter the tickets
    // TODO: This won't work if it's using a regular field (vs custom field)
    let filteredTickets: any[];
    if (
      team.zendesk_field_id &&
      team.zendesk_field_values.length > 0
    ) {
      filteredTickets = tickets.filter(
        (ticket: any) =>
          !ticket.custom_fields ||
          ticket.custom_fields.filter(
            (field: any) =>
              field.id.toString() === team.zendesk_field_id &&
              team.zendesk_field_values.includes(field.value),
          ).length > 0,
      );
    } else {
      filteredTickets = tickets;
    }

    const messageBlocks: any = [];

    // TODO: Make the header dynamic
    // TODO: Add a link to the view
    const viewLink = `${ZENDESK_BASE_URL}/agent/filters/${viewID}`;
    // messageBlocks.push(createSectionBlock("Good morning on-callers :sunny:\nThere are *total of X tier 3 tickets* assigned to you - *Y open, 3 pending customers and 1 closed*."))
    messageBlocks.push(
      createSectionBlock(
        `Good morning team :sunny:\nThere are *${filteredTickets.length}* tickets assigned to you in the <${viewLink}|${viewData.title}> view.`,
      ),
    );

    // If there are tickets, summarize them
    if (filteredTickets.length > 0) {
      messageBlocks.push(createDivider());


      const aggregateBuckets = new Map<string, number>();

      for (const item of filteredTickets) {
        // Check the aggregated key, and aggregate the ticket by it
        // ========================================================

        // TODO: Find a way to get the ID only once
        if (team.zendesk_aggregated_field_id) {
          // We're in Aggregated mode
          // ========================

          logger.debug(
            `Aggregating by field ID ${team.zendesk_aggregated_field_id}`,
          );

          // Look for an aggregation key in the custom fields
          const customFieldsAggKey = item.custom_fields.filter(
            (field: any) => field.id.toString() === team.zendesk_aggregated_field_id,
          );

          // Either get the aggregated key value from the default field, or from the custom fields
          let currAggKey;
          if (item[team.zendesk_aggregated_field_id]) {
            currAggKey = item[team.zendesk_aggregated_field_id];
          } else if (customFieldsAggKey.length > 0) {
            currAggKey = customFieldsAggKey[0].value;
          }

          if (currAggKey) {
            if (aggregateBuckets.has(currAggKey)) {
              const currValue = aggregateBuckets.get(currAggKey) || 0;
              aggregateBuckets.set(currAggKey, currValue + 1);
            } else {
              aggregateBuckets.set(currAggKey, 1);
            }
          }
        } else {
          logger.debug("No aggregation key supplied, we're in details mode.");

          // Details Mode
          // =================

          // TODO: Use button instead of link. Button requires interactivity, with requires a server.
          // messageBlocks.push(createSectionBlock(`*${item.subject}* / ${organizationName}.\nAssignee: *${userResponse}*, Priority *${item.priority}*, Status *${item.status}*`, createButton("Details", `${ZENDESK_BASE_URL}/agent/tickets/${item.id}`)));
          messageBlocks.push(...(await createDetailModeBlocks(item)));
        }
      }

      // If we're in aggregated mode, create the aggregated message
      if (team.zendesk_aggregated_field_id && aggregateBuckets.size > 0) {
        messageBlocks.push(
          createAggregateMessage(aggregateBuckets, team.zendesk_aggregated_field_id),
        );
      }
    }

    await sendSlackMessage(
      slackClient,
      "Zendesk tickets status",
      event.channel,
      event.thread_ts,
      messageBlocks,
    );

    logger.info("DONE!");
  }
}
