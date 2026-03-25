Show the user available resources across all UBC domains.

1. Call `ubc_domains` to list all domains
2. Ask which domain to explore (or show all)
3. For the chosen domain, call `ubc_catalog` to show resources:
   - Present them in a friendly format: name, description, free-tier limits
   - Group by category
4. If the user asks about a specific resource, call `ubc_resource_guide` for full details
5. If the user's interest doesn't match any domain, suggest creating a new one via the discovery agent
