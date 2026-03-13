export const agentKeys = {
  all: ['agents'] as const,
  list: (accountId: string) => [...agentKeys.all, 'list', accountId] as const,
  detail: (accountId: string, agentId: string) =>
    [...agentKeys.all, 'detail', accountId, agentId] as const,
};

export const providerKeys = {
  all: ['providers'] as const,
  list: (accountId: string) =>
    [...providerKeys.all, 'list', accountId] as const,
  detail: (accountId: string, providerId: string) =>
    [...providerKeys.all, 'detail', accountId, providerId] as const,
};
