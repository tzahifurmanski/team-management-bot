export const getRandomFromArray = function (array: any[]) {
  const random = Math.floor(Math.random() * array.length);
  return array[random];
};

// TODO Make this prettier
export const toDateTime = function(secs: any): Date {
  var t = new Date(1970, 0, 1); // Epoch
  t.setSeconds(secs);
  return t;
};

// This method takes a date and removes all time information from it
export const removeTimeInfoFromDate = function(date: Date): Date {
  date.setUTCHours(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);

  return date;
};

export const setDateToSunday = function(date: Date): Date {
  const day = date.getDay() || 7;
  if (day !== 0) date.setHours(-24 * (day - 1));
  return date;
};
