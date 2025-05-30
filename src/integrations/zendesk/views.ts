import { httpGet } from "../utils.js";
import { ZENDESK_BASE_URL, ZENDESK_TOKEN } from "../consts.js";
import { logger } from "../../settings/server_consts.js";

export const getTicketsByView = async (
  zendeskViewID: string,
): Promise<any[]> => {
  let url = `${ZENDESK_BASE_URL}/api/v2/views/${zendeskViewID}/tickets.json`;
  let zendeskResponse = await httpGet(url, ZENDESK_TOKEN);
  const all = zendeskResponse.data.tickets;

  // Get the results from additional pages also
  while (zendeskResponse.data.next_page) {
    url = zendeskResponse.data.next_page;
    zendeskResponse = await httpGet(url, ZENDESK_TOKEN);
    all.push(...zendeskResponse.data.tickets);
  }

  logger.info(`A total of ${all.length} tickets were returned from Zendesk`);

  return all;
};

export const showView = async (zendeskViewID: string): Promise<any> => {
  const url = `${ZENDESK_BASE_URL}/api/v2/views/${zendeskViewID}`;
  const zendeskResponse = await httpGet(url, ZENDESK_TOKEN);
  return zendeskResponse.data.view;
};

// TODO: Does not support pagination, so only first 100 comments will be queried
export const listTicketComments = async (ticketId: string): Promise<any[]> => {
  // If I add &page[size]=1 then the ordering does not work
  const url = `${ZENDESK_BASE_URL}/api/v2/tickets/${ticketId}/comments.json?sort_order=desc`;
  const zendeskResponse = await httpGet(url, ZENDESK_TOKEN);
  return zendeskResponse.data.comments;
};
