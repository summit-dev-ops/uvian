'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { IntakeField, IntakeSchema } from '@/lib/api/types';
import { submitIntake } from '@/lib/api/intake';
import {
  buildDynamicSchema,
  type DynamicFormData,
} from '@/lib/schemas/intake.schema';
import { Input } from '@org/ui';
import { Button } from '@org/ui';
import { Field, FieldLabel, FieldError, FieldGroup } from '@org/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui';
import { Textarea } from '@org/ui';
import { importPublicKey, encryptPayload } from '@/lib/crypto';

interface DynamicFormProps {
  tokenId: string;
  schema: IntakeSchema;
  authToken?: string;
}

function FieldRenderer({
  field,
  control,
  errors,
}: {
  field: IntakeField;
  control: any;
  errors: Record<string, { message?: string }>;
}) {
  const error = errors[field.name]?.message;

  if (field.type === 'select') {
    return (
      <Field data-invalid={!!error}>
        <FieldLabel>
          {field.label}
          {field.required && ' *'}
        </FieldLabel>
        <Controller
          name={field.name}
          control={control}
          render={({ field: selectField }) => {
            return (
              <Select
                onValueChange={selectField.onChange}
                value={selectField.value}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={field.placeholder || 'Select an option'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }}
        />
        {error && <FieldError errors={[errors[field.name]]} />}
      </Field>
    );
  }

  if (field.type === 'textarea') {
    return (
      <Field data-invalid={!!error}>
        <FieldLabel>
          {field.label}
          {field.required && ' *'}
        </FieldLabel>
        <Controller
          name={field.name}
          control={control}
          render={({ field: textareaField }) => {
            return (
              <Textarea
                {...textareaField}
                placeholder={field.placeholder}
                rows={4}
              />
            );
          }}
        />
        {error && <FieldError errors={[errors[field.name]]} />}
      </Field>
    );
  }

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>
        {field.label}
        {field.required && ' *'}
      </FieldLabel>
      <Controller
        name={field.name}
        control={control}
        render={({ field: inputField }) => {
          return (
            <Input
              {...inputField}
              type={
                field.type === 'password'
                  ? 'password'
                  : field.type === 'email'
                  ? 'email'
                  : 'text'
              }
              placeholder={field.placeholder}
              value={inputField.value || ''}
            />
          );
        }}
      />
      {error && <FieldError errors={[errors[field.name]]} />}
    </Field>
  );
}

export function DynamicForm({ tokenId, schema, authToken }: DynamicFormProps) {
  const router = useRouter();
  const formSchema = buildDynamicSchema(schema.schema.fields);

  const form = useForm<DynamicFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  const mutation = useMutation({
    mutationFn: async (data: DynamicFormData) => {
      const payload: Record<string, unknown> = { ...data };

      if (schema.publicKey) {
        const publicKey = await importPublicKey(schema.publicKey);
        const encrypted = await encryptPayload(payload, publicKey);
        return submitIntake(
          tokenId,
          encrypted as unknown as Record<string, unknown>,
          authToken
        );
      }

      return submitIntake(tokenId, payload, authToken);
    },
    onSuccess: () => {
      router.push('/success');
    },
    onError: () => {
      router.push('/expired');
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FieldGroup>
        {schema.schema.fields.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            control={form.control}
            errors={
              form.formState.errors as Record<string, { message?: string }>
            }
          />
        ))}
      </FieldGroup>

      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Submitting...' : schema.submitLabel || 'Submit'}
      </Button>
    </form>
  );
}
