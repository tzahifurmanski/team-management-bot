export interface BotAction {
  performAction(event: any): Promise<void>;
  doesMatch(event: any): boolean;
}

// TODO: Can add here the ability to choose to ignore if this is done in a thread and to add a chaos element (only perform x percent of times)
