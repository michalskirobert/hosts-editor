export const cn = (...classes: readonly (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(" ");
