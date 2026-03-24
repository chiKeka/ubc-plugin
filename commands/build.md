Assemble and deploy the user's project using their provisioned services.

1. Call `ubc_status` to check what's provisioned
2. Read the active recipe from `/recipes/`
3. Check that all required services have status "ready"
4. If anything is missing, tell the user and offer to help provision it
5. If everything is ready:
   - Retrieve credentials using `ubc_get_credentials` with `reveal: true`
   - Create a new project directory
   - Scaffold the project based on the recipe
   - Create `.env` file with the retrieved credentials
   - Install dependencies
   - Deploy to the specified platform (Vercel, Cloudflare, etc.)
6. Report the result — show the deployed URL
