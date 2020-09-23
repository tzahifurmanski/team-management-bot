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
* Bat signal - A user can signal 'I need help' and the bot will post it in the team channel.
* Add an option to 'introduce yourself' to someone (and tag them) 
* Post a funny quote when someone uses a predefined keyword (SSO/team member)
* Add a command to 'say hi'


### Utils
* Status command (to see if the bot is alive) 
* A command to return all team specific help desk tickets (a parameter to include the last comment for each / another command to get the details for a ticket)
* Get monitoring / push notifications for flaky tests?
* Comment on a thread when someone tags the team Slack group (except for specific channels) / Instead maybe capture it in the team's asks channel
* See all pull requests that the team has been asked to review?
* Add a command to 'who should I talk to in case of emergency?' (Who's the oncall team member ATM)
* Announce feature - Publish some info about a team feature?
* Get stats on team channels (how many asks we got during X timeframe, how many we've checked off, what is still open)
* Tasks Management System Integration - Sprint progress tracking, tasks assignment, alerting on not meeting our sprint goals?
* Connect to our KPIs  
* Team asks channel - expand to get historical data and stats per months
* Team asks channel -If there is a PR that we've been asked to review, the bot will see if the PR is approved and if so will put a checked sign? (Need to be careful of false positives)

### Miscellaneous
* Before responding, verify that the person talking to the bot is a team member?
* Make it configurable as possible (so that can later be used by others as well)
* Add the app permission to custom the sending user details and support providing the bot name / icon via config
* Resolve Slack ids on initialization
* Provide a way to 'reload' dynamic in memory data (config, ids) 
* Healthcheck endpoint (in preparation to being deployed on a docker)
* Separate the slack.ts module to multiple modules (chat, conversation, init, etc)