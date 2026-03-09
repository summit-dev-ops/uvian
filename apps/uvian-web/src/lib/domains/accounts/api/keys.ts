export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: () => [...accountKeys.lists()] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (accountId: string) =>
    accountId
      ? ([...accountKeys.details(), accountId] as const)
      : ([...accountKeys.details()] as const),
  members: () => [...accountKeys.all, 'members'] as const,
  membersByAccount: (accountId: string) =>
    accountId
      ? ([...accountKeys.members(), accountId] as const)
      : ([...accountKeys.members()] as const),
};
