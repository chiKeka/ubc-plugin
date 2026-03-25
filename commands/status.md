Show the user their current UBC status across all domains.

1. Call `ubc_domains` to list available domains
2. Call `ubc_status` to get the full state
3. For each domain with activity, show:
   - Which resources are acquired and which aren't
   - Access tokens stored (values stay masked via `ubc_get_access`)
   - Active pattern (if any)
4. Show overall project status
5. Suggest next steps based on what's missing
