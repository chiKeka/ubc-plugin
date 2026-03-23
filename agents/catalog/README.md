# Catalog Agent

The catalog agent keeps the service catalog accurate and up to date. It
is the source of truth for what free-tier services are available and
what their current limits are.

It has two jobs: updating existing entries by checking pricing pages for
changes, and discovering new free-tier services by searching the web.

When limits change, it updates the service definition file. When a free
tier is removed, it marks the service as deprecated rather than deleting
it. Every check is timestamped so the other agents know how fresh the
data is.
