import { Command } from "commander";

export const statusCommand = new Command("status")
  .description("Check the status of a project")
  .argument("[project-id]", "Project ID (defaults to most recent)")
  .action(async (projectId?: string) => {
    console.log(`Project status: ${projectId ?? "(latest)"}`);
    console.log("(Phase 2 — query projects + project_services + agent_runs tables)");
  });
