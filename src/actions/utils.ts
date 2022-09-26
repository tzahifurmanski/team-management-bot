import cronstrue from "cronstrue";

const cron = require("node-cron");

export const getRandomFromArray = (array: any[]) => {
  const random = Math.floor(Math.random() * array.length);
  return array[random];
};

// TODO Make this prettier and add tests for this
export const toDateTime = (secs: any): Date => {
  const time = new Date(1970, 0, 1); // Set to Epoch
  time.setSeconds(secs);
  return time;
};

// This method takes a date and removes all time information from it
export const removeTimeInfoFromDate = (date: Date): Date => {
  date.setUTCHours(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);

  return date;
};

export const setDateToSunday = (date: Date): Date => {
  const day = date.getDay();
  if (day !== 0) date.setHours(-24 * (day - 1));
  date = removeTimeInfoFromDate(date);
  return date;
};

export class AskChannelParams {
  constructor(
    public actionType: string,
    public count: number,
    public timeMetric: string,
    public groupBy: string,
    public error?: string
  ) {}
}

// TODO: Refactor this to be cleaner
export const getAskChannelParameters = (ask: string): AskChannelParams => {
  // Check that we got enough params
  const askArray = ask.split(" ");
  let actionType;
  let groupBy;
  let timeMetric;
  let count;

  // Verify we got exactly 7 params - 'ask channel stats/status <COUNT> <TIME_PERIOD>' by days/weeks/months
  if (askArray.length === 7) {
    // Get values from params
    actionType = askArray[2];
    count = askArray[3];
    timeMetric = askArray[4];
    groupBy = askArray[6];
  }
  // Verify we got exactly 5 params - 'ask channel stats/status <COUNT> <TIME_PERIOD>'
  else if (askArray.length === 5) {
    // Get values from params
    actionType = askArray[2];

    // Check if we got 'ask channel stats/status by days/weeks/months' format
    if (askArray[3] === "by") {
      timeMetric = "days";
      count = 7;
      groupBy = askArray[4];
    } else {
      count = askArray[3];
      timeMetric = askArray[4];
      groupBy = "";
    }
  }
  // Check if we got the default version of 'ask channel stats'
  else if (askArray.length === 3) {
    // Use defaults - 7 days
    actionType = askArray[2];
    timeMetric = "days";
    count = 7;
    groupBy = "";
  } else {
    return new AskChannelParams("", -1, "", "", "Not all params provided");
  }

  // Validate the action type
  if (!["stats", "status", "summary"].includes(actionType)) {
    // Return error
    return new AskChannelParams("", -1, "", "", "Invalid action type provided");
  }

  // Validate the number of days
  if (Number(count) === undefined || Number(count) < 1) {
    return new AskChannelParams("", -1, "", "", "Invalid count provided");
  }

  // If the user has supplied a singular criteria, change it to plural
  if (Number(count) === 1 && ["day", "week", "month"].includes(timeMetric)) {
    timeMetric += "s";
  }

  if (!["days", "weeks", "months"].includes(timeMetric)) {
    // Return error
    return new AskChannelParams("", -1, "", "", "Invalid time metric provided");
  }

  if (groupBy && !["days", "weeks", "months"].includes(groupBy)) {
    // Return error
    return new AskChannelParams(
      "",
      -1,
      "",
      "",
      "Invalid group by clause provided"
    );
  }

  return new AskChannelParams(
    actionType,
    Number(count),
    timeMetric,
    groupBy,
    ""
  );
};

export const getStartingDate = (params: AskChannelParams): Date => {
  // How to calculate:
  // For days - count backwards from today
  // For weeks - count backwards from the beginning of the week
  // For months - count backwards from the beginning of the month
  let startingDate;

  const adjustedCount = params.count - 1; // Remove 1 from the number of requested count,
  // so '1' will be treated as 'this' (AKA '1 day' will be beginning of today, '1 week' will be beginning of this week,
  // and '1 month' will be beginning of this month)

  // Get the starting date - Days
  if (params.timeMetric === "days") {
    startingDate = new Date();
    startingDate.setDate(startingDate.getDate() - adjustedCount);
    removeTimeInfoFromDate(startingDate);
  } else if (params.timeMetric === "weeks") {
    startingDate = setDateToSunday(new Date());
    startingDate.setDate(startingDate.getDate() - 7 * adjustedCount);
    removeTimeInfoFromDate(startingDate);
  } else {
    // Get the timeframe for the beginning of the month
    const date = new Date();
    startingDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth() - adjustedCount, 1, 0)
    );
  }

  return startingDate;
};

export const scheduleCron = (
  condition: boolean,
  description: string,
  cronExpression: string,
  functionToSchedule: any,
  event: any,
  slackClient: any
) => {
  if (condition) {
    console.log(
      `Setting up a cron to ${description} (cron: ${cronExpression}, ${cronstrue.toString(
        cronExpression
      )}.)`
    );
    cron.schedule(cronExpression, () => {
      functionToSchedule(event, slackClient);
    });
  } else {
    console.log(`Skipping on setting up a cron to ${description}.`);
  }
};
