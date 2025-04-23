export interface SlackEventType {
  text: string;
  user: string;
  team: string;
  channel: string;
  thread_ts?: string;
}
