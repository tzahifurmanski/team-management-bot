import {
  UsersProfileGetArguments,
  UsersProfileGetResponse,
} from "@slack/web-api";
import { Profile } from "@slack/web-api/dist/types/response/UsersProfileGetResponse.js";

// TODO: Implement a cache here, so we won't need to query everytime

export const getUserProfile = async (
  slackClient: any,
  user: string,
): Promise<Profile | undefined> => {
  const options: UsersProfileGetArguments = { user };

  // This can also return response.user with the bot username
  const response: UsersProfileGetResponse =
    await slackClient.users.profile.get(options);
  return response?.profile;
};
