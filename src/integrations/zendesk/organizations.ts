import {httpGet} from "../utils";
import {ZENDESK_BASE_URL, ZENDESK_TOKEN} from "../slack/consts";

export const getOrganizationByID = async (organizationId: string): Promise<any> => {
    const url = `${ZENDESK_BASE_URL}api/v2/organizations/${organizationId}.json`;
    return await httpGet(url, ZENDESK_TOKEN);
}