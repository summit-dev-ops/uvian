import { createJobScopedService } from './scoped';
import { createJobAdminService } from './admin';
import {
  ServiceClients,
  JobScopedService,
  JobAdminService,
  CreateJobServiceConfig,
} from './types';

export function createJobService(_config: CreateJobServiceConfig): {
  scoped: (clients: ServiceClients) => JobScopedService;
  admin: (clients: ServiceClients) => JobAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createJobScopedService(clients),
    admin: (clients: ServiceClients) => createJobAdminService(clients),
  };
}

export const jobService = createJobService({});

export type {
  ServiceClients,
  JobScopedService,
  JobAdminService,
  CreateJobServiceConfig,
  CreateEventJobPayload,
  CreateJobPayload,
  ListJobsFilters,
  ListJobsResult,
  JobRecord,
} from './types';
