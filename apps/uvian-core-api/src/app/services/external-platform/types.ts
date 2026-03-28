export interface ExternalPlatform {
  id: string;
  owner_user_id: string;
  name: string;
  platform: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePlatformPayload {
  name: string;
  platform: string;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdatePlatformPayload {
  name?: string;
  platform?: string;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface CreateExternalPlatformServiceConfig {}

export interface ExternalPlatformScopedService {
  getPlatformsByUser(userId: string): Promise<ExternalPlatform[]>;
  getPlatformById(id: string): Promise<ExternalPlatform | null>;
  getPlatformByOwnerAndId(
    id: string,
    ownerUserId: string
  ): Promise<ExternalPlatform | null>;
  getActivePlatformsByUser(userId: string): Promise<ExternalPlatform[]>;
  createPlatform(
    userId: string,
    payload: CreatePlatformPayload
  ): Promise<ExternalPlatform>;
  updatePlatform(
    userId: string,
    id: string,
    payload: Partial<UpdatePlatformPayload>
  ): Promise<ExternalPlatform>;
  deletePlatform(userId: string, id: string): Promise<void>;
}

export interface ExternalPlatformAdminService {
  getPlatformById(id: string): Promise<ExternalPlatform | null>;
  getPlatformsByOwner(ownerUserId: string): Promise<ExternalPlatform[]>;
  getActivePlatforms(): Promise<ExternalPlatform[]>;
  getPlatformsByType(platform: string): Promise<ExternalPlatform[]>;
}
