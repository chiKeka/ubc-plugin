Help the user provision a specific service.

The user should specify which service: github, vercel, supabase, openai, or cloudflare.

1. Read the service definition from `/services/{service}.yaml`
2. Call `ubc_status` to see if it's already provisioned
3. If not provisioned, walk the user through:
   - Creating an account (show them the signup URL and steps)
   - Getting each required credential (show the URL and steps)
   - Ask them to paste each credential
4. Store credentials using `ubc_store_credential` (they are encrypted at rest)
5. Mark the service as ready using `ubc_update_status`

If the service depends on another service (e.g., Vercel requires GitHub), check that the dependency is provisioned first.
