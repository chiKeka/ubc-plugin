Help the user set up UBC from scratch.

1. Read `.ubc/state.json` to check current state (or note that it doesn't exist yet)
2. Read the available recipes from `/recipes/` and present them in a friendly way
3. Ask the user what they want to build (or let them pick a recipe)
4. For the chosen recipe, read the recipe YAML to see which services are needed
5. For each required service, read the service YAML from `/services/` and walk the user through:
   - Creating an account (if they don't have one)
   - Getting the required credentials (API keys, tokens, etc.)
   - Store each credential using `ubc_store_credential` (credentials are encrypted at rest)
   - Update progress using `ubc_update_status`
6. Once all services are provisioned, let the user know they're ready to build

Be friendly and patient. Assume the user is not technical. Explain everything step by step.
