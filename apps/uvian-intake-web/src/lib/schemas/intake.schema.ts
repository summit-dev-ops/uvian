import * as z from 'zod';
import type { IntakeField } from '../api/types';

export function buildDynamicSchema(
  fields: IntakeField[]
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case 'email':
        fieldSchema = z.string().email('Invalid email address');
        break;
      case 'password':
        fieldSchema = z.string().min(1, 'This field is required');
        break;
      case 'select':
        if (field.options && field.options.length > 0) {
          const validValues = field.options.map((opt) => opt.value);
          fieldSchema = z.string().refine((val) => validValues.includes(val), {
            message: 'Invalid selection',
          });
        } else {
          fieldSchema = z.string();
        }
        break;
      case 'textarea':
        fieldSchema = z.string();
        break;
      case 'text':
      default:
        fieldSchema = z.string();
        break;
    }

    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }

    shape[field.name] = fieldSchema;
  }

  return z.object(shape);
}

export type DynamicFormData = z.infer<ReturnType<typeof buildDynamicSchema>>;
