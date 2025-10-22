#!/bin/bash
# Helper script to run TypeScript scripts with .env.local loaded

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Run the command passed as arguments
npx tsx "$@"

