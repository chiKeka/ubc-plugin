/**
 * Credential vault types for encrypted credential storage
 */

export type CredentialType =
  | "api_key"
  | "oauth_token"
  | "connection_string"
  | "password"
  | "other";

export interface CredentialRecord {
  id: string;
  user_id: string;
  project_id: string | null;
  source_id: string;
  credential_name: string;
  credential_type: CredentialType;
  encrypted_value: string;
  encryption_iv: string;
  encryption_tag: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  expires_at: string | null;
}

/** Decrypted credential bundle for agent use */
export interface CredentialBundle {
  credential_name: string;
  credential_type: CredentialType;
  value: string;
  source_name: string;
  source_id: string;
  expires_at: string | null;
}

/** Input for storing a new credential */
export interface StoreCredentialInput {
  project_id?: string;
  source_id: string;
  credential_name: string;
  credential_type: CredentialType;
  plaintext_value: string;
  metadata?: Record<string, unknown>;
  expires_at?: string;
}
