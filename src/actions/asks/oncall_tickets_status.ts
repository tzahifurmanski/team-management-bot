import { BotAction } from "../base_action";
import {
  createDivider,
  createSectionBlock,
  sendSlackMessage,
} from "../../integrations/slack/messages";
import { getUserByID } from "../../integrations/zendesk/users";
import { getTicketsByView } from "../../integrations/zendesk/tickets";
import { getOrganizationByID } from "../../integrations/zendesk/organizations";
import {
  MONITORED_ZENDESK_FILTER_FIELD_ID,
  MONITORED_ZENDESK_FILTER_FIELD_VALUES,
  MONITORED_ZENDESK_VIEW,
  ONCALL_CHANNEL_ID,
  SlackWebClient,
  ZENDESK_BASE_URL,
  ZENDESK_TOKEN,
} from "../../integrations/slack/consts";
import { sanitizeCommandInput } from "../../integrations/slack/utils";
import { ONCALL_TICKETS_STATS_CRON } from "../../consts";

import cronstrue from "cronstrue";
import { scheduleCron } from "../utils";

export class OncallTicketsStatus implements BotAction {
  constructor() {
    if (this.isEnabled()) {
      scheduleCron(
        !!ONCALL_TICKETS_STATS_CRON,
        "update on oncall tickets status",
        ONCALL_TICKETS_STATS_CRON,
        this.getOncallTicketsStatus,
        {
          channel: ONCALL_CHANNEL_ID,
          thread_ts: "",
        },
        SlackWebClient
      );
    }
  }

  getHelpText(): string {
    let helpMessage =
      "`oncall tickets status` - Provide a summary of the current tickets currently active for your oncall team.";
    if (ONCALL_TICKETS_STATS_CRON) {
      helpMessage += `\n*A recurring ask channel post is scheduled to be sent ${cronstrue.toString(
        ONCALL_TICKETS_STATS_CRON
      )}.*`;
    }
    return helpMessage;
  }

  isEnabled(): boolean {
    return !!(
      ZENDESK_BASE_URL &&
      ZENDESK_TOKEN &&
      MONITORED_ZENDESK_VIEW &&
      ONCALL_CHANNEL_ID
    );
  }

  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith("oncall tickets status");
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    await this.getOncallTicketsStatus(event, slackClient);
  }

  async getOncallTicketsStatus(event: any, slackClient: any): Promise<void> {
    // TODO: Temporary fix. If client is null, get it again from consts.
    if (!slackClient) {
      slackClient = SlackWebClient;
    }

    console.log("Running oncall status ask");

    const tickets: any[] = await getTicketsByView(MONITORED_ZENDESK_VIEW);
    let filteredTickets: any[];

    // Check if we need to filter the tickets
    if (
      MONITORED_ZENDESK_FILTER_FIELD_ID &&
      MONITORED_ZENDESK_FILTER_FIELD_VALUES.length > 0
    ) {
      filteredTickets = tickets.filter(
        (ticket: any) =>
          !ticket.custom_fields ||
          ticket.custom_fields.filter(
            (field: any) =>
              field.id.toString() === MONITORED_ZENDESK_FILTER_FIELD_ID &&
              MONITORED_ZENDESK_FILTER_FIELD_VALUES.includes(field.value)
          ).length > 0
      );
    } else {
      filteredTickets = tickets;
    }

    const messageBlocks: any = [];

    // TODO: Make the header dynamic
    // messageBlocks.push(createSectionBlock("Good morning on-callers :sunny:\nThere are *total of X tier 3 tickets* assigned to you - *Y open, 3 pending customers and 1 closed*."))
    messageBlocks.push(
      createSectionBlock(
        `Good morning on-callers :sunny:\nThere are currently ${filteredTickets.length} tier 3 tickets currently assigned to you.`
      )
    );
    messageBlocks.push(createDivider());

    for (const item of filteredTickets) {
      // Get the details for the tickets
      const assigneeName: any = item.assignee_id
        ? (await getUserByID(item.assignee_id)).data?.user?.name
        : "Unassigned";
      const organizationName: any = item.organization_id
        ? (await getOrganizationByID(item.organization_id)).data?.organization
            ?.name
        : "N/A";

      // TODO: Use button instead of link. Button requires interactivity, with requires a server.
      // messageBlocks.push(createSectionBlock(`*${item.subject}* / ${organizationName}.\nAssignee: *${userResponse}*, Priority *${item.priority}*, Status *${item.status}*`, createButton("Details", `${ZENDESK_BASE_URL}agent/tickets/${item.id}`)));
      messageBlocks.push(
        createSectionBlock(
          `<${ZENDESK_BASE_URL}agent/tickets/${item.id}|*${item.subject}*> / *${organizationName}*.\nAssignee: *${assigneeName}*, Priority *${item.priority}*, Status *${item.status}*`
        )
      );

      // TODO: See if we need this
      // Get last comment details
      // const comment:any = (await listTicketComments(item.id))[0];
      // const commentText:string = comment.body.replace('\n','').trim();
      // const authorName =comment.author_id ? (await getUserByID(comment.author_id)).data?.user?.name : 'N/A';
      // const lastCommentDate = comment.created_at;
      // messageBlocks.push(createContext(`Last comment - ${authorName}/${lastCommentDate}:\n${commentText}`));
    }

    await sendSlackMessage(
      slackClient,
      "Oncall tickets status",
      event.channel,
      event.thread_ts,
      messageBlocks
    );

    console.log("DONE!");
  }
}
