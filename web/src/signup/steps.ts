/** The 3 steps of the signup, in the order of the URL /inscription/:step. */
export const STEPS = ['infos', 'profession', 'pratique'] as const;
export type Step = (typeof STEPS)[number];

