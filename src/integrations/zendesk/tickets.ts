import {httpGet} from "../utils";
import {MONITORED_ZENDESK_VIEW, ZENDESK_BASE_URL, ZENDESK_TOKEN} from "../slack/consts";

export const getAllTickets = async (): Promise<any[]> => {
    let url = `${ZENDESK_BASE_URL}api/v2/views/${MONITORED_ZENDESK_VIEW}/tickets.json`;
    let zendeskResponse = await httpGet(url, ZENDESK_TOKEN);
    const all = zendeskResponse.data.tickets;

    // Get all the paginated responses
    while(zendeskResponse.next_page){
        url=zendeskResponse.next_page
        zendeskResponse = await httpGet(url, ZENDESK_TOKEN);
        all.push(zendeskResponse.data.tickets)
    }

    return all;
}


// TODO: Does not support pagination, so only first 100 comments will be queried
export const listTicketComments = async (ticketId : string): Promise<any[]> => {
    // If I add &page[size]=1 then the ordering does not work
    const url = `${ZENDESK_BASE_URL}api/v2/tickets/${ticketId}/comments.json?sort_order=desc`;
    const zendeskResponse = await httpGet(url, ZENDESK_TOKEN);
    return zendeskResponse.data.comments;
}