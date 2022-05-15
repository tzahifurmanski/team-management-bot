#!/bin/zsh

# ==================================================================
# This script is to help maintain multiple bots.
# It assumes
# * All bots have a git remote branch with a 'bot' suffix present
# ==================================================================

# Get the names of all the remote bots to iterate, excluding 'origin', removing duplicates
bots=( $(git remote -v | grep -v "origin" | grep -i "bot" | awk '{print $1;}' | uniq) )

for name in "${bots[@]}"
do
  # Push latest updates
  echo -n "Processing ${name}..."
  git push ${name}
  echo "${name} processing is done."
done