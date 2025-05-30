import { SectionBlock } from "@slack/web-api";
import {
  createSectionBlock,
  createText,
} from "../integrations/slack/messages.js";
import { getUserProfile } from "../integrations/slack/users.js";
import { getValueFromProfile } from "../integrations/slack/utils.js";
import {
  USER_PROFILE_FIELD_ID_DEPARTMENT,
  USER_PROFILE_FIELD_ID_DIVISION,
  USER_PROFILE_FIELD_ID_TEAM,
} from "../settings/team_consts.js";
import { logger } from "../settings/server_consts.js";

export interface AsksChannelReportResult {
  statsByTeam: Map<string, number>;
  statsByDivision: Map<string, number>;
  statsByDepartment: Map<string, number>;
}

export const createReport = async (
  slackClient: any,
  messages: any[],
): Promise<AsksChannelReportResult> => {
  const statsByTeam: Map<string, number> = new Map<string, number>();
  const statsByDivision: Map<string, number> = new Map<string, number>();
  const statsByDepartment: Map<string, number> = new Map<string, number>();

  await Promise.all(
    messages.map(async (message: any) => {
      const userProfile =
        (await getUserProfile(slackClient, message.user)) || {};
      const teamName: string = getValueFromProfile(
        userProfile,
        USER_PROFILE_FIELD_ID_TEAM,
      );
      const divisionName: string = getValueFromProfile(
        userProfile,
        USER_PROFILE_FIELD_ID_DIVISION,
      );
      const departmentName: string = getValueFromProfile(
        userProfile,
        USER_PROFILE_FIELD_ID_DEPARTMENT,
      );

      countEntry(statsByTeam, teamName);
      countEntry(statsByDivision, divisionName);
      countEntry(statsByDepartment, departmentName);
    }),
  );

  // TODO: If I remove this, the sorting gets mixed up. IDK why :|
  logger.info(statsByTeam.values());
  logger.info(statsByDivision.values());
  logger.info(statsByDepartment.values());

  return { statsByTeam, statsByDivision, statsByDepartment };
};

const countEntry = (collection: Map<string, number>, key: string) => {
  let count = collection.get(key);
  if (count) {
    count += 1;
  } else {
    count = 1;
  }
  collection.set(key, count);
};

export const createReportSection = (
  collection: Map<string, number>,
  criteria: string,
): SectionBlock[] => {
  const messageBlocks: SectionBlock[] = [];

  if (collection.size > 0) {
    const fields: any[] = [createText(`*${criteria}*`), createText("*Count*")];
    messageBlocks.push(
      createSectionBlock(`*Asks divided by ${criteria}:*`, fields),
    );

    // Sort from highest to lower
    collection = new Map([...collection.entries()].sort((a, b) => b[1] - a[1]));
    collection.forEach((count, entity) => {
      const entryFields: any[] = [
        {
          type: "plain_text",
          text: entity,
        },
        {
          type: "plain_text",
          text: count.toString(),
        },
      ];

      messageBlocks.push(createSectionBlock("", entryFields));
    });
  }

  return messageBlocks;
};
