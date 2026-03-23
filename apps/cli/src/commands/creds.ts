import { Command } from "commander";

export const credsCommand = new Command("creds")
  .description("Manage stored credentials");

credsCommand
  .command("list")
  .description("List all stored credentials")
  .action(async () => {
    // TODO: Phase 2 — query credential_vault via Supabase
    console.log("Credential vault (coming in Phase 2)");
    console.log("No credentials stored yet.");
  });

credsCommand
  .command("show <name>")
  .description("Show a specific credential (decrypted)")
  .action(async (name: string) => {
    console.log(`Credential: ${name}`);
    console.log("(Phase 2 — encrypted credential retrieval)");
  });

credsCommand
  .command("export")
  .description("Export all project credentials as .env file")
  .option("-p, --project <id>", "Project ID to export credentials for")
  .action(async (opts) => {
    console.log(`Exporting credentials${opts.project ? ` for project ${opts.project}` : ""}...`);
    console.log("(Phase 2 — .env export)");
  });
