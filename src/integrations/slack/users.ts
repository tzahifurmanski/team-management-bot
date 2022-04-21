import { SlackWebClient } from "./consts";
import {UsersProfileGetArguments, UsersProfileGetResponse} from "@slack/web-api";
import {Profile} from "@slack/web-api/dist/response/UsersProfileGetResponse";

// TODO: Implement a cache here, so we won't need to query everytime
export const getUserProfile = async function (
  user: string
): Promise<Profile | undefined> {
  const options: UsersProfileGetArguments = {
    user: user,
  };

  // This can also return response.user with the bot user name
  const response: UsersProfileGetResponse = await SlackWebClient.users.profile.get(options);
  return response?.profile;
};
