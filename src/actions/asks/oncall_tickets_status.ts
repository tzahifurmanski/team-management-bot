import { BotAction } from "../base_action";
import {
  createDivider,
  createSectionBlock,
  sendSlackMessage,
} from "../../integrations/slack/messages";
import { getUserByID } from "../../integrations/zendesk/users";
import { getAllTickets } from "../../integrations/zendesk/tickets";
import { getOrganizationByID } from "../../integrations/zendesk/organizations";
import {
  MONITORED_ZENDESK_VIEW,
  ONCALL_CHANNEL_ID,
  ZENDESK_BASE_URL,
  ZENDESK_TOKEN,
} from "../../integrations/slack/consts";
import { sanitizeCommandInput } from "../../integrations/slack/utils";
import { ONCALL_TICKETS_STATS_CRON } from "../../consts";
import { getOncallTicketsStatus } from "../../logic/cron_jobs";

import cronstrue from "cronstrue";
import { scheduleCron } from "../utils";

export class OncallTicketsStatus implements BotAction {
  constructor() {
    if (this.isEnabled()) {
      scheduleCron(
        !!ONCALL_TICKETS_STATS_CRON,
        "update on oncall tickets status",
        ONCALL_TICKETS_STATS_CRON,
        getOncallTicketsStatus
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
    console.log("Running oncall status ask");

    const tickets = await getAllTickets();

    const filteredTickets = tickets.filter(
      (ticket: any) =>
        !ticket.custom_fields ||
        ticket.custom_fields.filter(
          (field: any) =>
            // TODO: Make this filter dynamic, instead of hard coded -  filter to only get the tickets for relevant engineering groups
            field.id === 360010151217 &&
            [
              "group_platform_governance",
              "group_sdlc",
              "group_platform_foundation",
            ].includes(field.value)
        ).length > 0
    );

    const messageBlocks: any = [];

    // TODO: Make the header dynamic
    // messageBlocks.push(createSectionBlock("Good morning platform group oncallers :sunny:\nThere are *total of X tier 3 tickets* assigned to you - *Y open, 3 pending customers and 1 closed*."))
    messageBlocks.push(
      createSectionBlock(
        "Good morning platform group oncallers :sunny:\nHere are the tier 3 tickets assigned to you:"
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
