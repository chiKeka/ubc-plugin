Assemble the user's outcome from their acquired resources.

1. Call `ubc_domains` to identify the relevant domain
2. Call `ubc_status` for that domain to check what's acquired
3. Check that all required resources have status "ready"
4. If anything is missing, tell the user and offer to help acquire it
5. If everything is ready:
   - Retrieve access tokens using `ubc_get_access` with `reveal: true`
   - For compute: create project, scaffold, wire services, create `.env`, deploy
   - For other domains: create the structured outcome based on the pattern
6. Report the result — show what was built and how to access it
