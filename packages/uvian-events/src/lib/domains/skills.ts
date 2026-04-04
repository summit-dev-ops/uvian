import { EVENT_TYPE_PREFIX } from '../constants';

const prefix = EVENT_TYPE_PREFIX;

export const SkillEvents = {
  SKILL_CREATED: `${prefix}.skill.skill_created`,
  SKILL_UPDATED: `${prefix}.skill.skill_updated`,
  SKILL_DELETED: `${prefix}.skill.skill_deleted`,
  SKILL_LINKED: `${prefix}.skill.skill_linked`,
  SKILL_UNLINKED: `${prefix}.skill.skill_unlinked`,
} as const;

export type SkillEventType = (typeof SkillEvents)[keyof typeof SkillEvents];

export interface SkillCreatedData {
  skillId: string;
  accountId: string;
  name: string;
  createdBy: string;
}

export interface SkillUpdatedData {
  skillId: string;
  updatedBy: string;
  name?: string;
}

export interface SkillDeletedData {
  skillId: string;
  deletedBy: string;
}

export interface SkillLinkedData {
  agentId: string;
  skillId: string;
  linkedBy: string;
}

export interface SkillUnlinkedData {
  agentId: string;
  skillId: string;
  unlinkedBy: string;
}

export type SkillEventData =
  | SkillCreatedData
  | SkillUpdatedData
  | SkillDeletedData
  | SkillLinkedData
  | SkillUnlinkedData;
