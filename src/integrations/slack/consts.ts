export const SLACK_USER_FORMAT = /<@.*>/;

// User-Specific Tokens Configurations
export const SLACK_SIGNING_SECRET: string =
  process.env.SLACK_SIGNING_SECRET || "";

// TODO: Remove once the cron jobs are moved.
export let SlackWebClient: any;

export const setSlackWebClient = (client: any) => {
  SlackWebClient = client;
};
