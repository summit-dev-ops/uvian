'use client';

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@org/ui';
import { Button } from '@org/ui';
import { Label } from '@org/ui';
import { Textarea } from '@org/ui';
import { Loader2, AlertCircle } from 'lucide-react';
import { jobMutations } from '~/lib/domains/jobs/api/mutations';

interface JobCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Form data interface
interface JobFormData {
  type: string;
  input: string; // JSON string
}

// Validation errors interface
interface FormErrors {
  type?: string;
  input?: string;
  submit?: string;
}

export function JobCreationModal({
  isOpen,
  onClose,
  onSuccess,
}: JobCreationModalProps) {
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = React.useState<JobFormData>({
    type: '',
    input: '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isValidating, setIsValidating] = React.useState(false);

  // Job creation mutation
  const { mutate: createJob, isPending } = useMutation(
    jobMutations.createJob(queryClient)
  );

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({ type: '', input: '' });
      setErrors({});
    }
  }, [isOpen]);

  // Validate JSON input
  const validateJsonInput = (jsonString: string): boolean => {
    if (!jsonString.trim()) {
      setErrors((prev) => ({ ...prev, input: 'Job input is required' }));
      return false;
    }

    try {
      const parsed = JSON.parse(jsonString);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        setErrors((prev) => ({
          ...prev,
          input: 'Input must be a valid JSON object',
        }));
        return false;
      }
      setErrors((prev) => ({ ...prev, input: undefined }));
      return true;
    } catch (error) {
      setErrors((prev) => ({ ...prev, input: 'Invalid JSON format' }));
      return false;
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.type) {
      newErrors.type = 'Job type is required';
    }

    if (!validateJsonInput(formData.input)) {
      // JSON validation is handled by validateJsonInput
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsValidating(true);

    try {
      // Parse JSON input
      const inputData = JSON.parse(formData.input);

      // Create job
      createJob(
        {
          type: formData.type,
          input: inputData,
        },
        {
          onSuccess: () => {
            console.log('Job created successfully');
            onClose();
            onSuccess?.();
          },
          onError: (error: any) => {
            setErrors({ submit: error.message || 'Failed to create job' });
          },
        }
      );
    } catch (error) {
      setErrors({ submit: 'Invalid JSON input' });
    } finally {
      setIsValidating(false);
    }
  };

  // Handle input changes
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, type: e.target.value }));
    if (errors.type) {
      setErrors((prev) => ({ ...prev, type: undefined }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, input: value }));
    if (errors.input) {
      // Validate in real-time for better UX
      validateJsonInput(value);
    }
  };

  // Predefined job types
  const jobTypes = [
    { value: 'chat', label: 'Chat' },
    { value: 'task', label: 'Task' },
    { value: 'analysis', label: 'Analysis' },
    { value: 'processing', label: 'Processing' },
    { value: 'export', label: 'Export' },
  ];

  // Example JSON templates
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

  // Handle template selection
  const handleUseTemplate = () => {
    if (formData.type) {
      const template = getJsonTemplate(formData.type);
      handleInputChange({
        target: { value: template },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>
            Create a new job with the specified type and input data.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="job-type">Job Type *</Label>
            <select
              id="job-type"
              value={formData.type}
              onChange={handleTypeChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select job type</option>
              {jobTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          {/* JSON Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="job-input">Job Input (JSON) *</Label>
              {formData.type && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseTemplate}
                >
                  Use Template
                </Button>
              )}
            </div>
            <Textarea
              id="job-input"
              placeholder="Enter job input as JSON..."
              value={formData.input}
              onChange={handleInputChange}
              className="min-h-[200px] font-mono text-sm"
            />
            {errors.input && (
              <p className="text-sm text-red-600">{errors.input}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter a valid JSON object that will be passed to the job.
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {errors.submit}
            </div>
          )}

          {/* Validation Status */}
          {(isValidating || isPending) && (
            <div className="flex items-center gap-2 p-3 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isValidating ? 'Validating input...' : 'Creating job...'}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || isValidating}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Job'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
