'use client';

/**
 * Profiles List Interface Component
 *
 * Main interface for listing and managing user profiles,
 * providing search, filtering, and profile management features.
 */

import * as React from 'react';
import { User, Search, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@org/ui';
import { Input } from '@org/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@org/ui';
import { ScrollArea } from '@org/ui';
import { Badge } from '@org/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui';
import type { ProfileUI } from '~/lib/domains/profile/types';

export interface ProfilesListInterfaceProps {
  // Configuration
  showSearch?: boolean;
  showFilters?: boolean;
  showActions?: boolean;

  // Callbacks
  onProfileSelect?: (profile: ProfileUI) => void;
  onProfileEdit?: (profile: ProfileUI) => void;
  onProfileDelete?: (profile: ProfileUI) => void;
  onCreateProfile?: () => void;

  // Styling
  className?: string;
}

export function ProfilesListInterface({
  showSearch = true,
  showFilters = true,
  showActions = true,
  onProfileSelect,
  onProfileEdit,
  onProfileDelete,
  onCreateProfile,
  className,
}: ProfilesListInterfaceProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<string>('all');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');

  // Mock profiles data - in real implementation this would come from the API
  const profiles: ProfileUI[] = [
    {
      id: '1',
      userId: 'user_001',
      displayName: 'John Doe',
      bio: 'Software engineer passionate about building great user experiences',
      avatarUrl: null,
      type: 'human',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-20T00:00:00.000Z',
      isActive: true,
      agentConfig: null,
      publicFields: {
        skills: ['React', 'TypeScript', 'Node.js', 'UI/UX Design'],
        email: 'john.doe@example.com',
        location: 'San Francisco, CA',
      },
    },
    {
      id: '2',
      userId: 'user_002',
      displayName: 'Jane Smith',
      bio: 'Product manager with expertise in agile methodologies and user research',
      avatarUrl: null,
      type: 'human',
      createdAt: '2024-01-10T00:00:00.000Z',
      updatedAt: '2024-01-18T00:00:00.000Z',
      isActive: true,
      agentConfig: null,
      publicFields: {
        skills: ['Product Management', 'Agile', 'User Research', 'Strategy'],
        email: 'jane.smith@example.com',
        location: 'New York, NY',
      },
    },
    {
      id: '3',
      userId: 'agent_001',
      displayName: 'Support Assistant',
      bio: 'AI-powered support assistant helping users with their questions and concerns',
      avatarUrl: null,
      type: 'agent',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-22T00:00:00.000Z',
      isActive: true,
      agentConfig: {
        isVerified: true,
        capabilities: ['Customer Support', 'Problem Solving', 'Communication'],
      },
      publicFields: {
        email: 'support@uvian.com',
        responseTime: '< 1 minute',
      },
    },
  ];

  const filteredProfiles = React.useMemo(() => {
    let filtered = profiles;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (profile) =>
          profile.displayName.toLowerCase().includes(query) ||
          profile.bio?.toLowerCase().includes(query) ||
          ((profile.publicFields.skills as string[]) || []).some(
            (skill: string) => skill.toLowerCase().includes(query)
          )
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((profile) => profile.type === selectedType);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'active') {
        filtered = filtered.filter((profile) => profile.isActive);
      }
    }

    return filtered;
  }, [profiles, searchQuery, selectedType, selectedStatus]);

  const handleProfileSelect = (profile: ProfileUI) => {
    onProfileSelect?.(profile);
  };

  const handleProfileEdit = (profile: ProfileUI, e: React.MouseEvent) => {
    e.stopPropagation();
    onProfileEdit?.(profile);
  };

  const handleProfileDelete = (profile: ProfileUI, e: React.MouseEvent) => {
    e.stopPropagation();
    onProfileDelete?.(profile);
  };

  return (
    <ScrollArea className="flex-1">
      <div className={`space-y-6 p-6 ${className || ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Profiles</h1>
            <p className="text-muted-foreground mt-1">
              Manage user profiles and view their information and skills.
            </p>
          </div>
          {showActions && (
            <Button
              onClick={onCreateProfile}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Profile
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        {(showSearch || showFilters) && (
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {showSearch && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search profiles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {showFilters && (
              <div className="flex gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="human">Humans</SelectItem>
                    <SelectItem value="agent">Agents</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredProfiles.length} of {profiles.length} profiles
          </p>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </Button>
          )}
        </div>

        {/* Profiles Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onSelect={() => handleProfileSelect(profile)}
              onEdit={(e) => handleProfileEdit(profile, e)}
              onDelete={(e) => handleProfileDelete(profile, e)}
              showActions={showActions}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredProfiles.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No profiles found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first profile'}
            </p>
            {!searchQuery &&
              selectedType === 'all' &&
              selectedStatus === 'all' && (
                <Button onClick={onCreateProfile}>Create Profile</Button>
              )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// Profile Card Component
interface ProfileCardProps {
  profile: ProfileUI;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  showActions: boolean;
}

function ProfileCard({
  profile,
  onSelect,
  onEdit,
  onDelete,
  showActions,
}: ProfileCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{profile.displayName}</CardTitle>
              <CardDescription className="text-sm">
                {profile.type === 'agent' ? 'AI Agent' : 'User'}
              </CardDescription>
            </div>
          </div>

          {showActions && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Bio */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {profile.bio || 'No bio available'}
        </p>

        {/* Skills */}
        {profile.publicFields.skills &&
          profile.publicFields.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.publicFields.skills.slice(0, 3).map((skill: string) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {profile.publicFields.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{profile.publicFields.skills.length - 3}
                </Badge>
              )}
            </div>
          )}

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          <Badge
            variant={profile.type === 'agent' ? 'default' : 'outline'}
            className="text-xs"
          >
            {profile.type === 'agent' ? 'AI Agent' : 'Human'}
          </Badge>

          {profile.type === 'agent' && profile.agentConfig?.isVerified && (
            <Badge variant="secondary" className="text-xs">
              Verified
            </Badge>
          )}

          {profile.isActive ? (
            <Badge variant="outline" className="text-xs text-green-600">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-red-600">
              Inactive
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onSelect}>
            View Profile
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
