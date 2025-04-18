import { httpGet } from "../utils.js";
import { ZENDESK_BASE_URL, ZENDESK_TOKEN } from "../consts.js";

export const getUserByID = async (userId: string): Promise<any> => {
  const url = `${ZENDESK_BASE_URL}/api/v2/users/${userId}.json`;
  return await httpGet(url, ZENDESK_TOKEN);
};
