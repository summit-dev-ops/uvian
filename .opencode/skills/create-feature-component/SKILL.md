---
name: create-feature-component
description: Deeply integrated guide for building feature orchestrators that bridge multiple domain libraries.
---

# Skill: Create Feature Orchestrator (Integrated)

Use this skill to build user-facing features in `components/features/[feature]`. Features orchestrate multiple `lib/domains` modules to solve specific user stories.

## 🏗 Directory Structure

```text
/components/features/[feature]/
  ├── hooks/              # Orchestration (The "Bridge")
  │   └── use-[feature].ts
  ├── components/          # High-level feature UI
  │   └── [FeatureBlock].tsx
  ├── index.ts            # Public Feature API
  └── types.ts            # Local feature UI types
```

## 🌉 1. The "Hook Bridge" Pattern

Feature components must never call domain API clients or raw queries directly. They must use an orchestrator hook.

### Feature Orchestrator Hook (`hooks/use-[feature].ts`)

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  knowledgeQueries,
  knowledgeMutations,
} from '~/lib/domains/knowledge/api';
import { assetMutations } from '~/lib/domains/assets/api';

export function useSmartUpload() {
  // 1. Compose domain-level hooks/queries
  const { data: entities } = useQuery(knowledgeQueries.list());
  const upload = useMutation(assetMutations.upload());

  const handleUpload = async (file: File, entityId: string) => {
    // 2. Sequence operations across multiple domains
    const asset = await upload.mutateAsync(file);
    await executeMutation(knowledgeMutations.linkAsset(entityId, asset.id));
  };

  return { entities, handleUpload, isPending: upload.isPending };
}
```

## 🎨 2. Component Composition

Features should compose primitive UI elements and domain-specific molecules.

```typescript
// components/[FeatureBlock].tsx
export function FeatureBlock() {
  const { entities, handleUpload, isPending } = useFeatureOrchestrator();

  return (
    <div className="grid">
      <EntityList data={entities} />
      <Uploader onUpload={handleUpload} loading={isPending} />
    </div>
  );
}
```

## ⚖️ Technical Rules

- ✅ **DOMAIN ORCHESTRATION**: A single feature can (and should) import from as many `lib/domains` as needed to fulfill the requirement.
- ✅ **PURE UI BOUNDARIES**: Feature components handle layout and interaction; they delegate **all** domain-state transitions to the orchestrator hook.
- ✅ **ABSTRACTION**: Components should only see the outcome and simplified methods provided by the orchestrator.
- ✅ **LIBRARY FIRST**: If a calculation or fetch can be shared, it belongs in `lib/domains`, not in the feature.

> [!IMPORTANT] > **Decoupling Rule**: UI is tied to a **Feature**, Logic is tied to a **Domain**. Do not lock your UI components into domain folders if they need to orchestrate multiple systems.
