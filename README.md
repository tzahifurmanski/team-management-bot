[![Known Vulnerabilities](https://snyk.io/test/github/tzahifurmanski/team-slack-bot/badge.svg)](https://snyk.io/test/github/tzahifurmanski/team-slack-bot)

# team-slack-bot

A slack bot for engineering teams to get various stats and perform team related actions.

## Setup / Deployment:

* Set up a Slack app
  * Configure the with relevant permissions (TBD, add permissions list)
  * Install to workspace
  * Enable 'App Home > Always Show My Bot as Online' and 'Allow users to send Slash commands and messages from the
    messages tab'
  * Register for event subscriptions
    * Enable events and set request URL to : BOT_URL/events/slack
    * Subscribe to bot events
      * app_mention
      * message.channels
      * message.im
* Setup an Heroku NodeJS app
  * Connect your local git repo to heroku
    * heroku git:remote -a APP_NAME
    * git remote rename heroku designbot (TBD, unify the same commands)
  * If you want to add a new profile, add it to the assets/personalities folder (Temporary step)
  * Set up your config variables - See [config vars list here](config-variables.txt)

To be dynamic, the bot relies on configuration being passed through environment variables. To setup:

* For local testing - Create a '.env' file and pass the environment variables through there.
* For production - Deploy the bot on Heroku (or equivalent service) and pass the environment variables through config
  variables.

### Personalities setup

* The bot supports multiple personalities.
* Currently, you can choose from 'BoJack Horseman', 'Unibot', 'Rhinobot', 'Narwhalbot' and 'Designbot'
* Setup the personality with the 'BOT_PERSONALITY' config var. Note: The personality should be exactly as the folder
  name under 'personalities'

### Features setup
## Zendesk Integration
In order to integrate the bot with Zendesk, you need to supply two configurations:
* ZENDESK_TOKEN
* ZENDESK_BASE_URL

## Oncall Tickets Status
Oncall tickets status feature does a daily summary of the current tickets currently active for your oncall team.
In order to enable the feature, you need to:
* Configure Zendesk Integration
  * Set up the following configurations:
    * 

## Known issues:

* ATM, if there are more than 50 asks open, you won't see their details. This is caused by adding too many 'blocks' to
  one slack message (needs to be fixed). To workaround this issue, you can:
  Manually look back at your history and :white_check_mark: all the completed tasks (at least for the last 60 days, so
  they won't be counted as not handled). Ask the bot to give you stats on a specific number of days (like ask channel
  stats 10 ), find a number that works (less than 50 open asks), handle everything and increase the number of days again
  - until tasks are handled!
