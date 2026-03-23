/**
 * Template registry — maps service names to template availability.
 */

import { loadTemplate } from "./loader.js";
import type { ServiceTemplate } from "./schema.js";

const templateCache = new Map<string, ServiceTemplate | null>();

export function getTemplate(serviceName: string): ServiceTemplate | null {
  const key = serviceName.toLowerCase();
  if (templateCache.has(key)) {
    return templateCache.get(key)!;
  }
  const template = loadTemplate(key);
  templateCache.set(key, template);
  return template;
}

export function hasTemplate(serviceName: string): boolean {
  return getTemplate(serviceName) !== null;
}
