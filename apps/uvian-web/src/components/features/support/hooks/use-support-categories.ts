import { useQuery } from '@tanstack/react-query';
import { supportQueries } from '~/lib/domains/support/api/queries';

export function useSupportCategories() {
  const query = useQuery({
    ...supportQueries.categories(),
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
