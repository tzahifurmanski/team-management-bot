export const getRandomFromArray = function (array: any[]) {
  const random = Math.floor(Math.random() * array.length);
  return array[random];
};

// TODO Make this prettier
export const toDateTime = function (secs: any): Date {
  var t = new Date(1970, 0, 1); // Epoch
  t.setSeconds(secs);
  return t;
};
