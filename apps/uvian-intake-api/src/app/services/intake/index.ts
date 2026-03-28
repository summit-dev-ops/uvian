import { createIntakeScopedService } from './scoped';
import { createIntakeAdminService } from './admin';
import { ServiceClients } from './types';
import {
  CreateIntakeServiceConfig,
  IntakeScopedService,
  IntakeAdminService,
} from './types';

export function createIntakeService(_config: CreateIntakeServiceConfig): {
  scoped: (clients: ServiceClients) => IntakeScopedService;
  admin: (clients: ServiceClients) => IntakeAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createIntakeScopedService(clients),
    admin: (clients: ServiceClients) => createIntakeAdminService(clients),
  };
}

export type {
  IntakeScopedService,
  IntakeAdminService,
  CreateIntakeServiceConfig,
  ServiceClients,
  IntakeField,
  IntakeSchema,
  CreateIntakeInput,
  Intake,
  Submission,
} from './types';
