import { BotAction } from "../base_action";
import { sendSlackMessage } from "../../integrations/slack/messages";
import { getRandomFromArray } from "../utils";

const GIFS: string[] = [
  "https://media.giphy.com/media/3ohs7KuZF1l8kAlalG/giphy.gif",
  "https://media.giphy.com/media/9D7Jr7o9TjKta/giphy.gif",
  "https://media.giphy.com/media/EMHTwKXYU3myAyNCsE/giphy.gif",
  "https://media.giphy.com/media/fiqmax8KM9Fbl5WQnz/giphy.gif",
  "https://media.giphy.com/media/l2SpWMTKLCdV70OzK/giphy.gif",
  "https://media.giphy.com/media/cnWb1QJg7FGzrdEVKF/giphy.gif",
  "https://media.giphy.com/media/lD76yTC5zxZPG/giphy.gif",
  "https://media.giphy.com/media/21T9PmWttOb0EFrrwK/giphy.gif",
  "https://media.giphy.com/media/l3zoPOOq8HpzifRFS/giphy.gif",
  "https://media.giphy.com/media/12S6FJ0LFqKNyM/giphy.gif",
  "https://media.giphy.com/media/82US6lnvxSwdpqhqbp/giphy.gif",
  "https://media.giphy.com/media/3orif9VSPhRwQAfj7W/giphy.gif",
  "https://media.giphy.com/media/3oEduXXBwLDCtaGfNS/giphy.gif",
  "https://media.giphy.com/media/3oEdvddejaTWNpNCTK/giphy.gif",
  "https://media.giphy.com/media/qxqXS7PhBWgWk/giphy.gif",
  "https://media.giphy.com/media/xUPGcpfvIsVNeOAZgI/giphy.gif",
  "https://media.giphy.com/media/l3vRj1iPtZEvpvTVu/giphy.gif",
  "https://media.giphy.com/media/l4HnSkiOE7iA0Zjl6/giphy.gif",
  "https://media.giphy.com/media/61dyee7EfvuGWmDDPT/giphy.gif",
  "https://media.giphy.com/media/tsUDLjvigc27B9pBPs/giphy.gif",
  "https://tenor.com/bnpgu.gif",
  "https://tenor.com/bgfX9.gif",
  "https://tenor.com/u240.gif",
];

export class FolksResponse implements BotAction {
  doesMatch(event: any): boolean {
    return event.text.toLowerCase().startsWith("folks");
  }

  async performAction(event: any): Promise<void> {
    const gif = getRandomFromArray(GIFS);

    await sendSlackMessage(
      gif,
      event.channel,
      event.thread_ts ? event.thread_ts : event.ts
    );
  }
}
