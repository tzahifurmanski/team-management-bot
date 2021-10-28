[![Known Vulnerabilities](https://snyk.io/test/github/tzahifurmanski/team-slack-bot/badge.svg)](https://snyk.io/test/github/tzahifurmanski/team-slack-bot)

# team-slack-bot

A slack bot for engineering teams to get various stats and perform team related actions.

## Setup / Deployment:

* Set up a Slack app with relevant permissions (TBD, add permissions list)
* Setup an Heroku NodeJS app
  * Connect your local git repo to heroku
    * heroku git:remote -a APP_NAME
    * git remote rename heroku designbot (TBD, unify the same commands)
  * If you want to add a new profile, add it to the assets/personalities folder (Temporary step)
  * Set up your config variables (TBD, list the different vars)
    * ASK_CHANNEL_STATS_CRON
    *

To be dynamic, the bot relies on configuration being passed through environment variables. To setup:

* For local testing - Create a '.env' file and pass the environment variables through there.
* For production - Deploy the bot on Heroku (or equivalent service) and pass the environment variables through config
  variables.

### Personalities setup

* The bot supports multiple personalities.
* Currently, you can choose from 'BoJack Horseman' and 'Unibot' (A friendly unicorn bot).
* Setup the personality with the 'BOT_PERSONALITY' config var.
Note: The personality should be exactly as the folder name under 'personalities'    


