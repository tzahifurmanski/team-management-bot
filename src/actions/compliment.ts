const { sendSlackMessage, getUserIDInText } = require("../slack");

// TODO: Add more / make it funnier :)
// Got compliments from various sources:
// * Some I thought about
// * https://pairedlife.com/friendship/Funny-Compliments-for-Friends
// * https://www.theodysseyonline.com/compliments-cheer-somebody-up
const COMPLIMENTS_POOL = [
  "Just so you'll know - <@<SENDER>> thinks you're as bright as a button! :purple_heart:",
  "Are you a beaver? Because damn!",
  "I’d choose your company over pizza anytime.",
  "I still can’t believe that you’re actually a nice person.",
  "If I had a glass of water and you were on fire, I would, without a second thought, ignore my thirst and pour the water on you.",
  "You are not someone I pretend not to see in public.",
  "As much as I would love to spend time with you every day, some days, I actually have stuff to do.",
  "I would trust you to delete my browser history if something bad happened to me.",
  "I would delete your browser history for you if you suddenly died.",
  "You should be thanked more often. So, thank you, thank you, and thank you!",
  "It’s a good thing you’re not a drug, because I would be extremely addicted if you were, and I would then have to waste money and time on rehab.",
  "I bet you could survive the a zombie apocalypse, because you’re such a bad-ass!",
  "You may not be really, REALLY good-looking, but you’re pretty damn close!",
  "I don’t know if sarcasm is a skill, but you’ve certainly mastered it.",
  "Wow, for a second there, I mistook you for mirror.",
  "The only “b” word I should call you is “beautiful!”",
  "You know what’s awesome? Chocolate cake! And oh, your face as well.",
  "There are plenty of friends that I worry about. You're not one of them because I know you'd always do well.",
  "I bet you sweat glitters.",
  "The hardest part about having you as a friend is that I have to pretend that I like my other friends as much as I like you.",
  "You may not exactly be a good role model, but your bad example really help in serving as warnings to me.",
  "I brag about you to my other friends.",
  "You make me want to be a better bot. :purple_heart:",
  "If your humor was in bottle form, I would spray it on everyone.",
  "God should make more of you.",
  "You’re the only person who gets my sarcasm.",
  "Puppies and kittens probably share photos of you with one another in their very own social network.",
  "Even if you were cloned, you’d still be one of a kind. And the better-looking one.",
  "You’re not lazy, I tell you. It’s just that the people around you are way too active!",
  "You’re the OG of kindness.",
  "The more you talk, the more I like you.",
  "You significantly raise the average of human goodness.",
  "You're at the top of the bell curve!",
  "The more I get to know you, the more I believe unicorns might be real too.",
  "You don’t just look like you know what you’re doing, you actually do!",
  "Wait, let me wear my sunglasses, you shine way too bright.",
  "I feel half empty when I’m with you because you bring out everything that’s good in me.",
  "I’m sorry, but I think you’re the culprit behind global warming.",
  "I like puppies, but I think I like you way more.",
  "So… you’re the angel who fell.",
  "I don’t like to see you first thing in the morning, but you know I’m a liar.",
  "How many medals did your mum and dad receive for raising you so well?",
  "You’re the only person in the world I’m willing to talk to before my first cup of coffee.",
  "I’ve changed so much since I met you, my dog doesn’t recognize me anymore.",
  "You make me want to believe in unicorns and Santa and tooth fairies.",
  "I thought I was normal, until I met you.",
  'To quote Liza Koshy, "You are beautiful just the way you is. Even if you are grammatically incorrect."',
  "Actions speak louder than words, and yours tell an incredible story.",
  "Any team would be lucky to have you on it.",
  "As cheesy as this is, I'm telling the truth: on a scale from 1 to 10, you're an 11.",
  "Everything seems brighter when you are near",
  "If someone based a movie off of you, it would win an Oscar because you're that incredible.",
  'If there was a superlative about you, it would be "most likely to keep being awesome."',
  "If you were a scented candle they'd call it 'Perfectly Imperfect' (and it would smell like summer).",
  "Short, sweet, and to the point: You're wonderful.",
  "Whenever you say 'hello,' you make somebody's day.",
  "You are a great role model to others.",
];

const getRandomCompliment = function () {
  const random = Math.floor(Math.random() * COMPLIMENTS_POOL.length);
  return COMPLIMENTS_POOL[random];
};

export const compliment_action = async function (event: any) {
  // TODO: Think of a better way to use the sender / receiver in the message
  const compliment = getRandomCompliment();

  const receiver = getUserIDInText(event.text);

  // If there is no receiver, ignore the compliment request
  if (!receiver) {
    return;
  }

  await sendSlackMessage(`${receiver} ${compliment}`);
};
