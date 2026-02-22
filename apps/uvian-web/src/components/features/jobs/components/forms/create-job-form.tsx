'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase } from 'lucide-react';

import { Button } from '@org/ui';
import { Input } from '@org/ui';
import { Textarea } from '@org/ui';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@org/ui';

// Validation schema for job form
const jobSchema = z.object({
  type: z.string().min(1, 'Job type is required'),
  resourceScopeId: z.string().min(1, 'Resource scope ID is required'),
  input: z
    .string()
    .min(1, 'Job input is required')
    .refine((value) => {
      try {
        const parsed = JSON.parse(value);
        return (
          typeof parsed === 'object' &&
          parsed !== null &&
          !Array.isArray(parsed)
        );
      } catch {
        return false;
      }
    }, 'Input must be a valid JSON object'),
});

export type CreateJobFormData = z.infer<typeof jobSchema>;

export interface CreateJobFormProps {
  // Optional initial data (for future edit mode)
  initialData?: {
    type: string;
    resourceScopeId: string;
    input: string;
  };

  // Required callbacks
  onSubmit: (data: CreateJobFormData) => void | Promise<void>;
  onCancel?: () => void;

  // Optional props
  isLoading?: boolean;
  showCancel?: boolean;
  className?: string;
  autoFocus?: boolean;
}

// Job type options
const JOB_TYPES = [
  { value: 'chat', label: 'Chat' },
  { value: 'agent', label: 'Agent' },
  { value: 'task', label: 'Task' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'processing', label: 'Processing' },
  { value: 'export', label: 'Export' },
];

// JSON templates for different job types
const getJsonTemplate = (type: string): string => {
  const templates: Record<string, string> = {
    chat: JSON.stringify(
      {
        message: 'Hello, how can you help me?',
        context: {},
      },
      null,
      2
    ),
    task: JSON.stringify(
      {
        title: 'Task title',
        description: 'Task description',
        priority: 'medium',
      },
      null,
      2
    ),
    analysis: JSON.stringify(
      {
        data: 'data to analyze',
        parameters: {
          method: 'summary',
        },
      },
      null,
      2
    ),
    processing: JSON.stringify(
      {
        file: 'path/to/file',
        operations: ['convert', 'compress'],
      },
      null,
      2
    ),
    export: JSON.stringify(
      {
        format: 'pdf',
        source: 'document_id',
        options: {
          includeImages: true,
        },
      },
      null,
      2
    ),
  };

  return (
    templates[type] ||
    JSON.stringify(
      {
        data: 'example data',
      },
      null,
      2
    )
  );
};

/**
 * CreateJobForm - Pure form component for creating/editing jobs
 * Reusable across modals, pages, and inline editing contexts
 */
export const CreateJobForm: React.FC<CreateJobFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  showCancel = true,
  className,
  autoFocus = true,
}) => {
  const form = useForm<CreateJobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      type: initialData?.type || '',
      resourceScopeId: initialData?.resourceScopeId || '',
      input: initialData?.input || '',
    },
    mode: 'onChange',
  });

  const { control, handleSubmit, reset, watch, setValue, formState } = form;
  const { isDirty, isValid } = formState;

  const watchedType = watch('type');

  React.useEffect(() => {
    if (initialData) {
      reset({
        type: initialData.type || '',
        resourceScopeId: initialData.resourceScopeId || '',
        input: initialData.input || '',
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: CreateJobFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit job form:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel && !isLoading) {
      onCancel();
    }
  };

  // Handle template selection
  const handleUseTemplate = () => {
    if (watchedType) {
      const template = getJsonTemplate(watchedType);
      setValue('input', template, { shouldDirty: true });
    }
  };

  // Validate JSON input in real-time
  const validateJsonInput = (jsonString: string): boolean => {
    if (!jsonString.trim()) return false;
    try {
      const parsed = JSON.parse(jsonString);
      return (
        typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      );
    } catch {
      return false;
    }
  };

  return (
    <form
      id="create-job-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className={`space-y-6 ${className || ''}`}
    >
      <FieldGroup>
        {/* Job Type */}
        <Controller
          name="type"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="job-type">Job Type *</FieldLabel>
              <select
                {...field}
                id="job-type"
                disabled={isLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select job type</option>
                {JOB_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <FieldDescription>
                Choose the type of job to create
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Resource Scope ID */}
        <Controller
          name="resourceScopeId"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="resource-scope-id">
                Resource Scope ID *
              </FieldLabel>
              <Input
                {...field}
                id="resource-scope-id"
                placeholder="Enter resource scope ID..."
                autoFocus={autoFocus && !watchedType}
                disabled={isLoading}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                Specify the resource scope for this job
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Job Input (JSON) */}
        <Controller
          name="input"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="job-input">Job Input (JSON) *</FieldLabel>
                {watchedType && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseTemplate}
                    disabled={isLoading}
                  >
                    Use Template
                  </Button>
                )}
              </div>
              <Textarea
                {...field}
                id="job-input"
                placeholder="Enter job input as JSON..."
                className="min-h-[200px] font-mono text-sm"
                disabled={isLoading}
                aria-invalid={fieldState.invalid}
                onChange={(e) => {
                  field.onChange(e);
                  // Validate JSON in real-time for better UX
                  if (e.target.value && !validateJsonInput(e.target.value)) {
                    // Let zod handle the validation display
                  }
                }}
              />
              <FieldDescription>
                Enter a valid JSON object that will be passed to the job
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          form="create-job-form"
          disabled={isLoading || !isDirty || !isValid}
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-t-transparent border-current/40 mr-2" />
          ) : (
            <Briefcase className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Creating...' : 'Create Job'}
        </Button>
      </div>
    </form>
  );
};
