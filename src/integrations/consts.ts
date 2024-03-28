// ================================
// Slack Integration Constants
// ================================

export const SLACK_USER_FORMAT = /<@.*>/;

// User-Specific Tokens Configurations
export const SLACK_SIGNING_SECRET: string =
  process.env.SLACK_SIGNING_SECRET || "";

// TODO: Remove once the cron jobs are moved.
export let SlackWebClient: any;

export const setSlackWebClient = (client: any) => {
  SlackWebClient = client;
};

// ================================
// Zendesk Integration Constants
// ================================

// Zendesk Integration Configurations
export const ZENDESK_TOKEN = process.env.ZENDESK_TOKEN || "";
export const ZENDESK_BASE_URL = process.env.ZENDESK_BASE_URL || "";
