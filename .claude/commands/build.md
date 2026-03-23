Assemble and deploy the user's project using their provisioned services.

1. Read `.ubc/state.json` to check what's provisioned
2. Read the active recipe from `/recipes/`
3. Check that all required services have status "ready"
4. If anything is missing, tell the user and offer to help provision it
5. If everything is ready:
   - Read credentials from `.ubc/credentials/`
   - Create a new project directory
   - Scaffold the project based on the recipe
   - Create `.env` file with all credentials
   - Install dependencies
   - Deploy to the specified platform (Vercel, Cloudflare, etc.)
6. Report the result — show the deployed URL
