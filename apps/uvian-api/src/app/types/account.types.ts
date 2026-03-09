export interface Account {
  id: string;
  name: string | null;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AccountMember {
  id: string;
  account_id: string;
  user_id: string;
  role: {
    name: string;
    permissions?: string[];
  };
  created_at: string;
  display_name?: string | null;
  avatar_url?: string | null;
  email?: string;
}

export interface CreateAccountPayload {
  name?: string;
  settings?: Record<string, any>;
}

export interface UpdateAccountPayload {
  name?: string;
  settings?: Record<string, any>;
}

export interface CreateAccountMemberPayload {
  userId: string;
  role?: {
    name: string;
    permissions?: string[];
  };
}

export interface UpdateAccountMemberPayload {
  role: {
    name: string;
    permissions?: string[];
  };
}

export interface CreateAccountRequest {
  Body: CreateAccountPayload;
}

export interface UpdateAccountRequest {
  Params: {
    accountId: string;
  };
  Body: UpdateAccountPayload;
}

export interface GetAccountRequest {
  Params: {
    accountId: string;
  };
}

export interface DeleteAccountRequest {
  Params: {
    accountId: string;
  };
}

export interface CreateAccountMemberRequest {
  Params: {
    accountId: string;
  };
  Body: CreateAccountMemberPayload;
}

export interface UpdateAccountMemberRequest {
  Params: {
    accountId: string;
    userId: string;
  };
  Body: UpdateAccountMemberPayload;
}

export interface DeleteAccountMemberRequest {
  Params: {
    accountId: string;
    userId: string;
  };
}

export interface GetAccountMembersRequest {
  Params: {
    accountId: string;
  };
}
