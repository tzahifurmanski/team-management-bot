import {BotAction} from "../base_action";
import {
    createSectionBlock,
    createDivider,
    sendSlackMessage,
} from "../../integrations/slack/messages";
import {getUserByID} from "../../integrations/zendesk/users";
import {getAllTickets} from "../../integrations/zendesk/tickets";
import {getOrganizationByID} from "../../integrations/zendesk/organizations";
import {
    MONITORED_ZENDESK_VIEW,
    ONCALL_CHANNEL_ID,
    ZENDESK_BASE_URL,
    ZENDESK_TOKEN
} from "../../integrations/slack/consts";
import {sanitizeCommandInput} from "../../integrations/slack/utils";

export class OncallTicketsStatus implements BotAction {
    getHelpText(): string {
        return "Provide a daily summary of the current tickets currently active for your oncall team (`oncall tickets status`)";
    }

    isEnabled(): boolean {
        return !!(ZENDESK_BASE_URL && ZENDESK_TOKEN && MONITORED_ZENDESK_VIEW && ONCALL_CHANNEL_ID);
    }

    doesMatch(event: any): boolean {
        return sanitizeCommandInput(event.text).startsWith("oncall tickets status");
    }

    async performAction(event: any): Promise<void> {
        console.log("Running oncall status ask");

        const tickets = await getAllTickets();

        // Filter the tickets
        const filteredTickets = tickets.filter((ticket: any) =>
            (!ticket.custom_fields || ticket.custom_fields.filter((field: any) =>
                    // TODO: Make this filter dynamic, instead of hard coded
                    (field.id === 360010151217 && ['platform_governance', 'group_sdlc'].includes(field.value))).length > 0
        ));

        const messageBlocks:any = []

        // TODO: Make the header dynamic
        // messageBlocks.push(createSectionBlock("Good morning platform group oncallers :sunny:\nThere are *total of X tier 3 tickets* assigned to you - *Y open, 3 pending customers and 1 closed*."))
        messageBlocks.push(createSectionBlock("Good morning platform group oncallers :sunny:\nHere are the tier 3 tickets assigned to you:"))
        messageBlocks.push(createDivider());

        for (const item of filteredTickets) {
            // Get the details for the tickets
            const assigneeName:any = item.assignee_id ? (await getUserByID(item.assignee_id)).data?.user?.name : 'Unassigned';
            const organizationName:any = item.organization_id ? (await getOrganizationByID(item.organization_id)).data?.organization?.name : 'N/A';

            // TODO: Use button instead of link. Button requires interactivity, with requires a server.
            // messageBlocks.push(createSectionBlock(`*${item.subject}* / ${organizationName}.\nAssignee: *${userResponse}*, Priority *${item.priority}*, Status *${item.status}*`, createButton("Details", `${ZENDESK_BASE_URL}agent/tickets/${item.id}`)));
            messageBlocks.push(createSectionBlock(`<${ZENDESK_BASE_URL}agent/tickets/${item.id}|*${item.subject}*> / *${organizationName}*.\nAssignee: *${assigneeName}*, Priority *${item.priority}*, Status *${item.status}*`));

            // TODO: See if we need this
            // Get last comment details
            // const comment:any = (await listTicketComments(item.id))[0];
            // const commentText:string = comment.body.replace('\n','').trim();
            // const authorName =comment.author_id ? (await getUserByID(comment.author_id)).data?.user?.name : 'N/A';
            // const lastCommentDate = comment.created_at;
            // messageBlocks.push(createContext(`Last comment - ${authorName}/${lastCommentDate}:\n${commentText}`));
        }

        await sendSlackMessage(
            'Oncall tickets status',
            event.channel,
            event.thread_ts,
            messageBlocks
        );

        console.log("DONE!");
    }
}