/** Vrai si l'erreur est une erreur Prisma connue avec ce code (ex. P2002 : unicité). */
export function hasPrismaCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
