export interface TeamMember {
  name: string
  role: string
  bio: string
}

/**
 * Ship empty, same rule as lib/testimonials.ts: the About page's Team
 * section only renders when this has entries — no unnamed placeholder
 * profiles shown to visitors. Add real entries here when the team is ready
 * to be named publicly.
 */
export const TEAM: TeamMember[] = []
