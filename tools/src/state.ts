/**
 * State management — tracks what's provisioned in .ubc/state.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UBC_DIR = join(__dirname, "..", "..", ".ubc");
const STATE_FILE = join(UBC_DIR, "state.json");

export interface ServiceState {
  status: "not_started" | "in_progress" | "ready" | "failed";
  credentials: string[];
  provisioned_at?: string;
}

export interface UBCState {
  services: Record<string, ServiceState>;
  active_recipe: string | null;
  project_status: "idle" | "planning" | "provisioning" | "assembling" | "ready" | "failed";
  created_at: string;
  updated_at: string;
}

function defaultState(): UBCState {
  return {
    services: {},
    active_recipe: null,
    project_status: "idle",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function getState(): UBCState {
  if (!existsSync(STATE_FILE)) {
    return defaultState();
  }
  const raw = readFileSync(STATE_FILE, "utf-8");
  return JSON.parse(raw) as UBCState;
}

function saveState(state: UBCState): void {
  if (!existsSync(UBC_DIR)) {
    mkdirSync(UBC_DIR, { recursive: true, mode: 0o700 });
  }
  state.updated_at = new Date().toISOString();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), { encoding: "utf-8", mode: 0o600 });
  chmodSync(STATE_FILE, 0o600);
}

export function updateServiceStatus(
  service: string,
  status: ServiceState["status"]
): void {
  const state = getState();
  if (!state.services[service]) {
    state.services[service] = { status: "not_started", credentials: [] };
  }
  state.services[service].status = status;
  if (status === "ready") {
    state.services[service].provisioned_at = new Date().toISOString();
  }
  saveState(state);
}

export function addCredentialToState(service: string, credName: string): void {
  const state = getState();
  if (!state.services[service]) {
    state.services[service] = { status: "not_started", credentials: [] };
  }
  if (!state.services[service].credentials.includes(credName)) {
    state.services[service].credentials.push(credName);
  }
  saveState(state);
}

export function setActiveRecipe(recipeId: string | null): void {
  const state = getState();
  state.active_recipe = recipeId;
  saveState(state);
}

export function setProjectStatus(status: UBCState["project_status"]): void {
  const state = getState();
  state.project_status = status;
  saveState(state);
}
