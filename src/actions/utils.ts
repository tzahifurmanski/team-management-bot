export const getRandomFromArray = (array: any[]) => {
  const random = Math.floor(Math.random() * array.length);
  return array[random];
};

// TODO Make this prettier and add tests for this
export const toDateTime = (secs: any): Date => {
  const time = new Date(1970, 0, 1); // Epoch
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
  return date;
};


export class AskChannelStatsParams {
  constructor(public count: number, public timeMetric: string, public error?: string) {}
}

export const getAskChannelStatsParameters = (ask: string): AskChannelStatsParams => {
  // Check that we got enough params
  const askArray = ask.split(" ");
  let timeMetric;
  let count;

  // Verify we got exactly 5 params - 'ask channel stats <COUNT> <TIME_PERIOD>'
  if(askArray.length === 5) {
    // Get values from params
    count = askArray[3];
    timeMetric = askArray[4];
  }
  else
  {
    // Check if we got the default version of 'ask channel stats'
    if(askArray.length === 3) {
      // Use defaults - 7 days
      timeMetric = 'days';
      count = 7;
    }
    else {
      return new AskChannelStatsParams(-1, "", "Not all params provided");
    }
  }

  // Validate the number of days
  if (Number(count) === undefined || Number(count) < 1) {
    return new AskChannelStatsParams(-1, "", "Invalid count provided");
  }

  // If the user has supplied a singular criteria, change it to plural
  if(Number(count) === 1 && ['day', 'week', 'month'].includes(timeMetric)) {
    timeMetric += "s";
  }
  if(!['days', 'weeks', 'months'].includes(timeMetric)) {
    // Return error
    return new AskChannelStatsParams(-1, "", "Invalid type provided");
  }

  return new AskChannelStatsParams(Number(count), timeMetric, "");
}

export const getStartingDate = (params: AskChannelStatsParams) : Date => {
  // How to calculate:
  // For days - count backwards from today
  // For weeks - count backwards from the beginning of the week
  // For months - count backwards from the beginning of the month
  let startingDate;

  const adjustedCount = params.count - 1 // Remove 1 from the number of requested count,
  // so '1' will be treated as 'this' (AKA '1 day' will be beginning of today, '1 week' will be beginning of this week,
  // and '1 month' will be beginning of this month)

  // Get the starting date - Days
  if(params.timeMetric === 'days') {
    startingDate = new Date();
    startingDate.setDate(startingDate.getDate() - adjustedCount);
    removeTimeInfoFromDate(startingDate);
  }
  else if(params.timeMetric === 'weeks')
  {
    startingDate = setDateToSunday(new Date());
    startingDate.setDate(startingDate.getDate() - 7 * adjustedCount);
    removeTimeInfoFromDate(startingDate);
  }
  else {
    // Get the timeframe for the beginning of the month
    const date = new Date();
    startingDate = new Date(
        Date.UTC(date.getFullYear(), date.getMonth() - adjustedCount, 1, 0)
    );

  }

  return startingDate;
}