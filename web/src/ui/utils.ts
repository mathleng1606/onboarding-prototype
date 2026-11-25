export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/** Toast for the parts of the app that the prototype does not cover. */
export const NOT_IN_PROTOTYPE = 'Pas inclus dans ce prototype';
