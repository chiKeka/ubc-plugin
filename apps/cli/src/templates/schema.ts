/**
 * Service template schema — defines the structure of YAML signup flow templates.
 */

export interface TemplateStep {
  name: string;
  action: "goto" | "click" | "fill" | "capture" | "wait" | "verify";
  url?: string;
  selector?: string;
  value?: string;
  wait_for?: string;
  requires?: string;
  optional?: boolean;
  timeout_ms?: number;
}

export interface CredentialExtraction {
  method: "create_and_capture" | "navigate_and_read" | "api_call";
  steps: TemplateStep[];
}

export interface TemplateCredential {
  name: string;
  type: "api_key" | "oauth_token" | "connection_string" | "password" | "other";
  location: "dashboard" | "settings" | "api" | "email";
  path: string;
  extraction: CredentialExtraction;
}

export interface ServiceTemplate {
  service: string;
  display_name: string;
  category: string;
  signup_url: string;
  auth_methods: string[];
  steps: TemplateStep[];
  credentials: TemplateCredential[];
  provides: string[];
  dependencies?: string[];
  free_tier?: {
    limits: Array<{
      name: string;
      value: number;
      unit: string;
    }>;
  };
}
