export interface UserSettings {
  userId: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  name: string | null;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  userRole: { name: string };
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
  email: string;
}

export type GetUserAccountRequest = {
  Querystring?: Record<string, unknown>;
  Params?: Record<string, unknown>;
  Body?: Record<string, unknown>;
};

export type GetUserProfileRequest = {
  Querystring?: Record<string, unknown>;
  Params?: Record<string, unknown>;
  Body?: Record<string, unknown>;
};

export type GetUserSettingsRequest = {
  Querystring?: Record<string, unknown>;
  Params?: Record<string, unknown>;
  Body?: Record<string, unknown>;
};

export interface UpdateUserSettingsRequest {
  Body: {
    settings: Record<string, any>;
  };
}

export type DeleteUserSettingsRequest = {
  Querystring?: Record<string, unknown>;
  Params?: Record<string, unknown>;
  Body?: Record<string, unknown>;
};
