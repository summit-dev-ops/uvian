import {
  QueryClient,
  MutationObserver,
  MutationOptions,
} from "@tanstack/react-query";

export function generateLocalId(base: string): string {
  return `${base}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function executeMutation<TData, TError, TVariables, TContext>(
  queryClient: QueryClient,
  options: MutationOptions<TData, TError, TVariables, TContext>,
  variables: TVariables
): Promise<TData> {
  const observer = new MutationObserver<TData, TError, TVariables, TContext>(
    queryClient,
    options
  );
  return observer.mutate(variables);
}