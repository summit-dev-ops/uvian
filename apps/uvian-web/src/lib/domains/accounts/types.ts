export type AccountUI = {
  id: string;
  name: string | null;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

export type AccountMemberUI = {
  id: string;
  accountId: string;
  userId: string;
  role: {
    name: string;
    permissions?: string[];
  };
  createdAt: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  email?: string;
};

export type CreateAccountPayload = {
  name?: string;
  settings?: Record<string, any>;
};

export type UpdateAccountPayload = {
  name?: string;
  settings?: Record<string, any>;
};

export type AddAccountMemberPayload = {
  userId: string;
  role?: {
    name: string;
    permissions?: string[];
  };
};

export type UpdateAccountMemberPayload = {
  role: {
    name: string;
    permissions?: string[];
  };
};
