#!/usr/bin/env node

import { Command } from "commander";
import { configCommand } from "./commands/config.js";
import { runCommand } from "./commands/run.js";
import { planCommand } from "./commands/plan.js";
import { provisionCommand } from "./commands/provision.js";
import { credsCommand } from "./commands/creds.js";
import { catalogCommand } from "./commands/catalog.js";
import { statusCommand } from "./commands/status.js";

const program = new Command();

program
  .name("ubc")
  .description("Universal Basic Compute — agentic platform for free-tier cloud services")
  .version("0.1.0");

program.addCommand(runCommand);
program.addCommand(planCommand);
program.addCommand(provisionCommand);
program.addCommand(credsCommand);
program.addCommand(catalogCommand);
program.addCommand(statusCommand);
program.addCommand(configCommand);

program.parse();
