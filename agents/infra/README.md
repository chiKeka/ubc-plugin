# Infra Agent

The infra agent helps users set up the infrastructure that lets UBC agents
run on their own. It deploys one of three runtimes depending on what
free compute the user has available:

- **OpenClaw** for persistent servers (Railway, Fly.io free tier).
- **MiniClaw** for serverless platforms (Vercel, Cloudflare Workers).
- **PicoClaw** for cron-based execution (GitHub Actions, cron-job.org).

It also configures cron jobs for periodic tasks, sets up MCP server
connections so agents can use external tools (Gmail, Slack, etc.), and
wires up agent-to-agent communication so the agents can delegate work
to each other without human intervention.
