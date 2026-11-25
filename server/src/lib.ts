import { randomUUID } from 'node:crypto';
import { z } from 'zod';

/** Error returned to the client as { error: { code, message, details? } }. */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new HttpError(404, `${what}_not_found`, `${what} not found`);

export function parse<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    throw new HttpError(422, 'validation_error', 'Invalid request', z.flattenError(result.error));
  }
  return result.data;
}

export const newUid = () => randomUUID();

/** SQLite 'YYYY-MM-DD HH:MM:SS[.SSS]' (UTC) -> ISO 8601. */
export function iso(value: string): string;
export function iso(value: string | null): string | null;
export function iso(value: string | null): string | null {
  return value === null ? null : `${value.replace(' ', 'T')}Z`;
}

export const bool = (v: number) => v === 1;

/** Lowercase, no accents: "Oméga" matches "omega". */
export const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
