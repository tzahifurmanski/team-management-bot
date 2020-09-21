# team-slack-bot
A slack bot for engineering teams (to get various stats and perform team related actions).
 
 Things it does:
 * TBD


## Installation
* Create a Slack app 
* TBD


## Commands
* TBD


## Ideas:

### Fun stuff
* An 'Assemble' function (that posts a DM message to the team)
* Bat signal - I need help, it them post in #unicorn-chatter


### Utils
* A command to return all open threads in #asks-unicorn (everything that doesn't have a V emoji)
* A command to return all open Tier 4 Zendesk ticket (a parameter to include the last comment for each / another command to get the detais for a tier 4 ticket)
* Get monitoring / push notifications for flaky tests?
* Post a funny quote when someone uses a predefined keyword (SSO/team member)
* Add a command to 'say hi'
* Comment on a thread when someone tags @unicorn! (except for specific channels) / Instead maybe capture it in #ask-unicorn channel
* See all pull requests that the team has been asked to review?
* Add a command to 'who should I talk to in case of emergency?' (Who's the oncall unicorn ATM)
* Announce feature -
* Get stats on team channels (how many #ask-unicorn messages we got during X timeframe, how many we've checked off, what is still open)


### Miscellaneous
* Before responding, verify that the requestor is a unicorn member?
* Make it configurable as possible (so that can later be used by others as well)
* Add the app permission to custom the sending user details and support providing the bot name / icon via config
* Resolve Slack ids on initialization
* Provide a way to 'reload' dynamic in memory data (config, ids) 
 