import { SectionBlock } from "@slack/web-api";
import { getUserByID } from "../integrations/zendesk/users.js";
import { getOrganizationByID } from "../integrations/zendesk/organizations.js";
import { createSectionBlock } from "../integrations/slack/messages.js";
import { ZENDESK_BASE_URL } from "../integrations/consts.js";

export const createDetailModeBlocks = async (
  item: any,
): Promise<SectionBlock[]> => {
  // Get the details for the tickets
  const assigneeName: any = item.assignee_id
    ? (await getUserByID(item.assignee_id)).data?.user?.name
    : "Unassigned";
  const organizationName: any = item.organization_id
    ? (await getOrganizationByID(item.organization_id)).data?.organization?.name
    : "N/A";

  // TODO: Use button instead of link. Button requires interactivity, with requires a server.
  // createSectionBlock(`*${item.subject}* / ${organizationName}.\nAssignee: *${userResponse}*, Priority *${item.priority}*, Status *${item.status}*`, createButton("Details", `${ZENDESK_BASE_URL}/agent/tickets/${item.id}`));
  const blocks: SectionBlock[] = [
    createSectionBlock(
      `<${ZENDESK_BASE_URL}/agent/tickets/${item.id}|*${item.subject}*> / *${organizationName}*.\nAssignee: *${assigneeName}*, Priority *${item.priority}*, Status *${item.status}*`,
    ),
  ];

  // TODO: Add last comment details to the message as optional
  // Get last comment details
  // const comment:any = (await listTicketComments(item.id))[0];
  // const commentText:string = comment.body.replace('\n','').trim();
  // const authorName =comment.author_id ? (await getUserByID(comment.author_id)).data?.user?.name : 'N/A';
  // const lastCommentDate = comment.created_at;
  // messageBlocks.push(createContext(`Last comment - ${authorName}/${lastCommentDate}:\n${commentText}`));

  return blocks;
};
export const createAggregateMessage = (
  aggregateBuckets: Map<string, number>,
  aggregateKeyFieldId: string,
): SectionBlock => {
  // Summarize the aggregated results.
  let aggregateMessage = `Num of tickets aggregated by the '${aggregateKeyFieldId}' field:\n`;

  // Sort buckets by number of tickets
  const sortedAggregateBuckets = new Map(
    [...aggregateBuckets.entries()].sort((a, b) => b[1] - a[1]),
  );
  for (const [key, count] of sortedAggregateBuckets.entries()) {
    aggregateMessage = aggregateMessage + `${key} - *${count}*\n`;
  }

  return createSectionBlock(aggregateMessage);
};
