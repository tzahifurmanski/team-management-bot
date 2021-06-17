import { SlackWebClient } from "./consts";
import { UsersInfoArguments, UsersInfoResponse } from "@slack/web-api";
import { User } from "@slack/web-api/dist/response/UsersInfoResponse";

// TODO: Implement a cache here, so we won't need to query everytime

// This returns a user object - https://api.slack.com/types/user
export const getUserDetails = async function (
  user: string
): Promise<User | undefined> {
  const options: UsersInfoArguments = {
    user: user,
  };

  // This can also return response.user with the bot user name
  let response: UsersInfoResponse = await SlackWebClient.users.info(options);
  return response?.user;
};

export const getUserDisplayName = async function (
  user: string
): Promise<string> {
  const user_object: User | undefined = await getUserDetails(user);
  return user_object?.profile?.display_name || "Unknown";
};
