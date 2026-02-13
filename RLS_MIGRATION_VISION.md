Space Service Multi-Profile Support: Migration to Row Level Security (RLS)
Overview

This document outlines the migration strategy for transforming the space service from a traditional application-level authorization approach to a Row Level Security (RLS) based system.

Critical Architectural Change: Instead of global database connections, we will move to a Per-Request Client Strategy. This ensures Supabase correctly identifies the calling user (auth.uid()) for every request, allowing the database to enforce security policies automatically.
Current State Analysis
Architecture Overview

The current space service operates with these key components:

    Authentication Layer: Fastify middleware validates JWT tokens via Supabase Auth.

    Database Connection: A single, global SERVICE_ROLE client (admin privileges) used for all requests.

    Authorization Logic: Manual WHERE clauses and separate validation queries in every service method.

Current Authorization Flow
code TypeScript

// Route Level
const userId = await userService.getCurrentUserFromRequest(request);
const profileId = await profileService.getCurrentProfileFromRequest(request);

// Service Level - Multiple validation queries
async getSpaceMembers(spaceId: string, userId: string, profileId: string) {
  // Query 1: Validate profile ownership
  const isValidProfile = await this.validateProfileOwnership(profileId, userId);
  if (!isValidProfile) throw new Error('Profile does not belong to user');

  // Query 2: Validate space access
  const hasSpaceAccess = await this.validateSpaceAccess(spaceId, profileId);
  if (!hasSpaceAccess) throw new Error('Access denied to space');

  // Query 3: Get actual data (using Admin Client)
  const members = await supabaseAdmin.from('space_members')...;
}

Current Issues & Challenges

    Performance Bottlenecks: 2-3 database queries per request (N+1 problem).

    Security Risks: Reliance on application logic. If a developer forgets a validation check, data leaks occur.

    Code Complexity: Duplicate validation logic across services.

    No Native RLS: Since the API uses a Service Role (Admin) client, auth.uid() is null in the database, rendering RLS useless.

Proposed RLS Solution
RLS Overview

We will shift to a Dual-Client Strategy:

    User Client (Scoped): Created per request using the user's JWT. RLS policies are applied automatically. Used for 95% of traffic.

    Admin Client (System): The existing global client. Used only for background jobs or specific overrides.

Key Benefits

    Zero-Latency Authorization: Authorization happens during the data fetch.

    75% Query Reduction: Single query operations.

    Deep Security: The database rejects unauthorized access even if the API code is buggy.

Implementation Strategy
Phase 1: Database Policy Creation
1. Performance Optimization Helper

To avoid expensive subqueries in every row check, we create a stable function.
code SQL

-- Helper: Get all profile IDs belonging to the current user
CREATE OR REPLACE FUNCTION auth.my_profile_ids()
RETURNS TABLE (id uuid) 
LANGUAGE sql STABLE SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid();
$$;

2. Core RLS Policies
code SQL

-- Policy 1: Profile Ownership (Base Security)
CREATE POLICY "Users can only see their own profiles" ON profiles
FOR SELECT USING (
  auth_user_id = auth.uid()
);

-- Policy 2: Space Membership Access
-- Allow access if the membership record belongs to one of my profiles
CREATE POLICY "Space membership access" ON space_members
FOR ALL USING (
  profile_id IN (SELECT auth.my_profile_ids())
);

-- Policy 3: Space Access (Visibility)
-- Allow access if I am a member via any of my profiles
CREATE POLICY "Space visibility" ON spaces
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM space_members sm
    WHERE sm.space_id = id
    AND sm.profile_id IN (SELECT auth.my_profile_ids())
  )
);

-- Policy 4: Creator Access
CREATE POLICY "Creator access" ON spaces
FOR ALL USING (
  created_by IN (SELECT auth.my_profile_ids())
);

Phase 2: Service Layer Transformation
The Client Factory

We stop using the global supabase import for user actions.
code TypeScript

// src/lib/supabase-factory.ts
import { createClient } from '@supabase/supabase-js';

// Factory: Creates a client acting AS THE USER
export const createUserClient = (accessToken: string) => {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  });
};

// Singleton: The Admin client (keep for system tasks)
export const adminClient = createClient(..., SERVICE_ROLE_KEY);

Transformed Service Method

Before (3 queries):
code TypeScript

async getSpaceMembers(spaceId: string, userId: string, profileId: string) {
  await this.validateProfileOwnership(profileId, userId); // Query 1
  await this.validateSpaceAccess(spaceId, profileId);     // Query 2
  return supabase.from('space_members')...                // Query 3
}

After (1 query):
code TypeScript

// We inject the user-scoped client
async getSpaceMembers(userSupabase: SupabaseClient, spaceId: string, profileId: string) {
  // We simply query the data.
  // 1. We filter by profileId so the UI gets the right context.
  // 2. RLS ensures 'profileId' actually belongs to 'auth.uid()'.
  // 3. If the user doesn't own the profile, RLS returns empty data.
  
  const { data, error } = await userSupabase
    .from('space_members')
    .select('*')
    .eq('space_id', spaceId)
    .eq('profile_id', profileId); 
    
  if (error) throw error;
  return data;
}

Hybrid Role Approach (Admin Override)

For complex scenarios where an admin needs to force a change despite RLS:
code TypeScript

async forceUpdateRole(spaceId: string, targetProfileId: string, newRole: string) {
  // Use the ADMIN client to bypass RLS
  return adminClient
    .from('space_members')
    .update({ role: newRole })
    .eq('space_id', spaceId)
    .eq('profile_id', targetProfileId);
}

Phase 3: Migration Strategy
Step-by-Step Migration Plan

    Database Prep

        Deploy auth.my_profile_ids() function.

        Enable RLS on tables (spaces, space_members, profiles).

        Apply policies (initially PERMISSIVE or FOR SELECT only to test).

    Code Updates (Route Layer)

        Update Fastify middleware to extract the JWT.

        Instantiate createUserClient(token) and attach it to the request object.

    Service Refactoring

        Update Service signatures to accept SupabaseClient.

        Remove validateProfileOwnership calls.

        Ensure all queries include .eq('profile_id', id) to scope the request correctly.

    Verification

        Test standard user flows (RLS applied).

        Test admin flows (RLS bypassed via Admin Client).

Testing Strategy
code TypeScript

describe('RLS Authorization', () => {
  test('Standard user cannot see other users spaces', async () => {
    // Create client acting as User A
    const clientA = createUserClient(tokenUserA);
    const result = await spacesService.getSpaces(clientA, profileA);
    
    // RLS filters the data automatically
    expect(result).not.toContain(userBSpace);
  });
});

Implementation Details
Required Code Changes
1. Route Middleware Update
code TypeScript

// middleware/auth.ts
fastify.decorateRequest('supabase', null);

fastify.addHook('preHandler', async (request, reply) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (token) {
    // Create a disposable client for this request
    request.supabase = createUserClient(token);
  } else {
    // Fallback or Unauthorized
    request.supabase = null; 
  }
});

2. Service Base Class
code TypeScript

export class BaseService {
  protected getClient(req: FastifyRequest): SupabaseClient {
    if (!req.supabase) throw new Error('No active session');
    return req.supabase;
  }
}

Performance Metrics
Before RLS

    Queries per op: 2.5 avg

    Connection: Single global connection

    Logic: Application Layer

After RLS

    Queries per op: 1

    Connection: Per-request lightweight client (Stateless HTTP)

    Logic: Database Layer (Native C++ speed)

Rollback Strategy

If RLS blocks legitimate traffic or performance degrades:

    Disable RLS:
    code SQL

    ALTER TABLE spaces DISABLE ROW LEVEL SECURITY;

    Revert Middleware:

        Switch request.supabase back to returning the global adminClient.

        Since the admin client bypasses RLS, the application behaves exactly as it did before (relying on manual validation logic, which we kept in the codebase but commented out/bypassed).

Conclusion

This migration corrects the architectural approach by leveraging JWT forwarding. By instantiating a Supabase client per request, we unlock the native power of PostgreSQL RLS, reducing our codebase size and database load simultaneously.
Next Steps

    Approve the Dual-Client Strategy.

    Create the auth.my_profile_ids SQL migration.

    Refactor one read-only service (e.g., getSpaces) as a Proof of Concept.