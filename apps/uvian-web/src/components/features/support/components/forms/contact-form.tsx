'use client';

/**
 * Contact Form Component
 *
 * Reusable contact form with modern validation and form patterns
 */

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send } from 'lucide-react';

import { Button, Input, Textarea } from '@org/ui';
import { Field, FieldError, FieldLabel, FieldGroup } from '@org/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui';

// Zod validation schema
const contactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  category: z.enum([
    'general',
    'technical',
    'billing',
    'feature-request',
    'bug-report',
  ]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export interface ContactFormProps {
  onSubmit: (data: ContactFormData) => void | Promise<void>;
  initialData?: Partial<ContactFormData>;
  isLoading?: boolean;
  showCancel?: boolean;
  onCancel?: () => void;
  className?: string;
  submitLabel?: string;
  cancelLabel?: string;
}

export function ContactForm({
  onSubmit,
  initialData,
  isLoading = false,
  showCancel = false,
  onCancel,
  className,
  submitLabel = 'Send Message',
  cancelLabel = 'Cancel',
}: ContactFormProps) {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      category: 'general',
      priority: 'medium',
      subject: '',
      message: '',
      ...initialData,
    },
    mode: 'onChange',
  });

  const { control, handleSubmit, reset, formState } = form;
  const { isDirty, isValid } = formState;

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      reset({
        name: '',
        email: '',
        category: 'general',
        priority: 'medium',
        subject: '',
        message: '',
        ...initialData,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: ContactFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit contact form:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      form.reset();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={`space-y-6 ${className || ''}`}
    >
      <FieldGroup>
        {/* Name and Email Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contact-name">Name (Optional)</FieldLabel>
                <Input
                  {...field}
                  id="contact-name"
                  placeholder="Your name"
                  disabled={isLoading}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contact-email">Email Address *</FieldLabel>
                <Input
                  {...field}
                  id="contact-email"
                  type="email"
                  placeholder="your@email.com"
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                  autoComplete="email"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        {/* Category and Priority Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="category"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contact-category">Category *</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Question</SelectItem>
                    <SelectItem value="technical">Technical Support</SelectItem>
                    <SelectItem value="billing">Billing & Payments</SelectItem>
                    <SelectItem value="feature-request">
                      Feature Request
                    </SelectItem>
                    <SelectItem value="bug-report">Bug Report</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="priority"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contact-priority">Priority *</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Not urgent</SelectItem>
                    <SelectItem value="medium">
                      Medium - Normal priority
                    </SelectItem>
                    <SelectItem value="high">High - Important issue</SelectItem>
                    <SelectItem value="urgent">
                      Urgent - Critical issue
                    </SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        {/* Subject */}
        <Controller
          name="subject"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contact-subject">Subject *</FieldLabel>
              <Input
                {...field}
                id="contact-subject"
                placeholder="Brief description of your issue"
                disabled={isLoading}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Message */}
        <Controller
          name="message"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contact-message">Message *</FieldLabel>
              <Textarea
                {...field}
                id="contact-message"
                placeholder="Please provide as much detail as possible about your issue or question..."
                rows={6}
                disabled={isLoading}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          {showCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading || (!isDirty && !initialData) || !isValid}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

export type { ContactFormData };
