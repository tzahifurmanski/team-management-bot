export const toDateTime = (secs: any): Date => {
  const time = new Date(1970, 0, 1); // Set to Epoch
  time.setSeconds(secs);
  return time;
};

// This method takes a UTC date and removes all time information from it
// Note that:
// 1. This method changes the input date.
// 2. The input date is expected to be in UTC time.
export const removeTimeInfoFromDate = (date: Date): Date => {
  date.setUTCHours(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);

  return date;
};

// This function receives a date object, and returns the same date object with the date set to the previous Sunday, without time info.
// If the provided date is already a sunday, it will return the same date.
export const setDateToSunday = (date: Date): Date => {
  const day = date.getUTCDay();
  const diff = date.getDate() - day;

  date = removeTimeInfoFromDate(new Date(date.setDate(diff)));
  return date;
};

export const getStartingDate = (timeMetric: string, count: number): Date => {
  // How to calculate:
  // For days - count backwards from today
  // For weeks - count backwards from the beginning of the week
  // For months - count backwards from the beginning of the month
  let startingDate;

  const adjustedCount = count - 1; // Remove 1 from the number of requested count,
  // so '1' will be treated as 'this' (AKA '1 day' will be beginning of today, '1 week' will be beginning of this week,
  // and '1 month' will be beginning of this month)

  // Get the starting date - Days
  if (timeMetric === "days") {
    startingDate = new Date();
    startingDate.setDate(startingDate.getDate() - adjustedCount);
    removeTimeInfoFromDate(startingDate);
  } else if (timeMetric === "weeks") {
    startingDate = setDateToSunday(new Date());
    startingDate.setDate(startingDate.getDate() - 7 * adjustedCount);
    removeTimeInfoFromDate(startingDate);
  } else {
    // Get the timeframe for the beginning of the month
    const date = new Date();
    startingDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth() - adjustedCount, 1, 0),
    );
  }

  return startingDate;
};
