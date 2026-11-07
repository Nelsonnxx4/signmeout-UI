import { z } from 'zod'

export function toFieldValidator<T>(schema: z.ZodType<T>) {
  return (value: unknown) => {
    const result = schema.safeParse(value)
    return result.success || result.error.issues[0]?.message || 'Check this field and try again.'
  }
}
