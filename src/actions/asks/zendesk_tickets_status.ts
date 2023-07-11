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
  SlackWebClient,
  ZENDESK_BASE_URL,
  ZENDESK_MONITORED_VIEW,
  ZENDESK_TICKETS_CHANNEL_ID,
  ZENDESK_TICKETS_CHANNEL_NAME,
  ZENDESK_TOKEN,
} from "../../integrations/slack/consts";
import { sanitizeCommandInput } from "../../integrations/slack/utils";
import { ZENDESK_TICKETS_STATS_CRON } from "../../consts";
import {
  getChannelIDFromEventText,
  getRecurringJobInfo,
  scheduleAskChannelsCrons,
} from "../utils";

export class ZendeskTicketsStatus implements BotAction {
  constructor() {
    if (this.isEnabled()) {
      if (ZENDESK_MONITORED_VIEW.length != ZENDESK_TICKETS_CHANNEL_ID.length) {
      }
      scheduleAskChannelsCrons(
        SlackWebClient,
        ZENDESK_TICKETS_STATS_CRON,
        ZENDESK_TICKETS_CHANNEL_ID,
        ZENDESK_TICKETS_CHANNEL_NAME,
        "zendesk tickets status",
        this.getZendeskTicketsStatus
      );
    }
  }

  getHelpText(): string {
    let helpMessage =
      "`zendesk tickets status` - Provide a summary of the current Zendesk tickets currently active for your team.";

    helpMessage += getRecurringJobInfo(
      "zendesk tickets status",
      ZENDESK_TICKETS_STATS_CRON,
      ZENDESK_TICKETS_CHANNEL_ID
    );

    return helpMessage;
  }

  isEnabled(): boolean {
    const isChannelIdPerName =
      ZENDESK_TICKETS_CHANNEL_ID.length === ZENDESK_TICKETS_CHANNEL_NAME.length;
    const isZendeskSetup = !!(ZENDESK_BASE_URL && ZENDESK_TOKEN);
    const isViewPerChannel =
      ZENDESK_MONITORED_VIEW.length === ZENDESK_TICKETS_CHANNEL_ID.length;
    // console.log(
    //   "conditions:",
    //   isChannelIdPerName,
    //   isZendeskSetup,
    //   isViewPerChannel
    // );

    return isChannelIdPerName && isZendeskSetup && isViewPerChannel;
  }

  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).startsWith(
      "zendesk tickets status"
    );
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    await this.getZendeskTicketsStatus(event, slackClient);
  }

  async getZendeskTicketsStatus(event: any, slackClient: any): Promise<void> {
    // TODO: Temporary fix. If client is null, get it again from consts.
    if (!slackClient) {
      console.log("Slack client is null. Getting it again from consts.");
      slackClient = SlackWebClient;
    }

    const askChannelId = getChannelIDFromEventText(
      event.text,
      3,
      ZENDESK_TICKETS_CHANNEL_ID[0]
    );
    if (!askChannelId) {
      console.log(`Unable to find channel ID. Ask: ${event.text}`);
      return;
    }

    console.log(`Running zendesk tickets status for channel ${askChannelId}`);

    const viewIndex = ZENDESK_TICKETS_CHANNEL_ID.indexOf(askChannelId);
    if (viewIndex === -1) {
      console.log(
        `Channel ${askChannelId} was not found in the monitored channels list. Skipping.`
      );
      await sendSlackMessage(
        slackClient,
        `Channel <#${askChannelId}> was not found in the monitored channels list. Unable to create a summary.`,
        event.channel,
        event.thread_ts ? event.thread_ts : event.ts
      );

      return;
    }

    const tickets: any[] = await getTicketsByView(
      ZENDESK_MONITORED_VIEW[viewIndex]
    );
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
        `Good morning team :sunny:\nThere are currently ${filteredTickets.length} tickets currently assigned to you in Zendesk.`
      )
    );

    if (filteredTickets.length > 0) {
      messageBlocks.push(createDivider());
    }

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
      "Zendesk tickets status",
      event.channel,
      event.thread_ts,
      messageBlocks
    );

    console.log("DONE!");
  }
}
