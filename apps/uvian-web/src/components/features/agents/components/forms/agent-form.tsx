'use client';

import * as React from 'react';
import { Button, Input, Textarea, Checkbox } from '@org/ui';
import { AVAILABLE_EVENT_TYPES } from '~/lib/domains/agents/types';

interface AgentFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    subscribed_events: string[];
  }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: Error | null;
  showCancel?: boolean;
  initialData?: {
    name?: string;
    description?: string;
    subscribed_events?: string[];
  };
}

export function AgentForm({
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  showCancel = true,
  initialData,
}: AgentFormProps) {
  const [name, setName] = React.useState(initialData?.name || '');
  const [description, setDescription] = React.useState(
    initialData?.description || ''
  );
  const [subscribedEvents, setSubscribedEvents] = React.useState<string[]>(
    initialData?.subscribed_events || []
  );

  const toggleEvent = (event: string) => {
    setSubscribedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      description,
      subscribed_events: subscribedEvents,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Agent"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this agent do?"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Subscribed Events</label>
        <div className="space-y-2">
          {AVAILABLE_EVENT_TYPES.map((event) => (
            <div key={event.value} className="flex items-center gap-2">
              <Checkbox
                id={event.value}
                checked={subscribedEvents.includes(event.value)}
                onCheckedChange={() => toggleEvent(event.value)}
                disabled={isLoading}
              />
              <label htmlFor={event.value} className="text-sm">
                {event.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error.message}</p>}

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
