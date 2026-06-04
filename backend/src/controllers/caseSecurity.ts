/**
 * Pure, dependency-free security helpers for case create/update handling.
 * Extracted so they can be unit-tested without a DB or Express context.
 */

// Fields that must never be set directly from client input on create/update.
// Status transitions and ownership are controlled server-side.
export const PROTECTED_CASE_FIELDS = [
  'createdBy',
  'authorName',
  'status',
  'caseId',
  '_id',
  'createdAt',
  'updatedAt',
] as const

export type CaseStatus = 'draft' | 'review' | 'published' | 'rejected'

/** Escape user text before using it inside a RegExp to prevent ReDoS / injection. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Remove protected fields from a client-supplied payload (mutates in place). */
export function stripProtectedFields(payload: Record<string, unknown>): void {
  for (const field of PROTECTED_CASE_FIELDS) {
    delete payload[field]
  }
}

/**
 * Resolve the status a case may receive, given the actor's role and request.
 * - Admins may set any valid status (default `published` on create).
 * - Instructors may only ever land on `draft` or `review`.
 */
export function resolveCaseStatus(
  isAdmin: boolean,
  requested: unknown,
  fallbackForAdmin: CaseStatus = 'published'
): CaseStatus {
  const req = typeof requested === 'string' ? requested : ''
  if (isAdmin) {
    return (['draft', 'review', 'published', 'rejected'] as string[]).includes(req)
      ? (req as CaseStatus)
      : fallbackForAdmin
  }
  return req === 'review' ? 'review' : 'draft'
}
