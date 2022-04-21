export interface BotAction {
  performAction(event: any): Promise<void>;
  doesMatch(event: any): boolean;
  // TODO: Add a help interface so the help command can iterate on automatically.

  // TODO: Add an interface to decide if the action should be added or not

  // TODO: Maybe add a default 'print' when this action is constructed 'Action X has been initiated' or 'Action X has been skipped'
}

// TODO: Can add here the ability to choose to ignore if this is done in a thread and to add a chaos element (only perform x percent of times)
