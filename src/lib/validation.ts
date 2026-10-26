import { z } from "zod";
import { parseAmountToCents } from "@/lib/domain";
import { AppError } from "@/lib/errors";

const id = z.string().min(1, "Identifiant manquant.");

const name = (what: string) =>
  z
    .string(`Le nom ${what} est obligatoire.`)
    .trim()
    .min(1, `Le nom ${what} est obligatoire.`)
    .max(50, `Le nom ${what} doit faire 50 caractères au maximum.`);

export const createGroupSchema = z.object({
  name: name("du groupe"),
});

export const addMemberSchema = z.object({
  groupId: id,
  name: name("du membre"),
});

export const expenseSchema = z.object({
  label: z
    .string("Le libellé est obligatoire.")
    .trim()
    .min(1, "Le libellé est obligatoire.")
    .max(100, "Le libellé doit faire 100 caractères au maximum."),
  amount: z.string("Le montant est obligatoire.").transform((value, ctx) => {
    const cents = parseAmountToCents(value);
    if (cents === null || cents <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Le montant doit être un nombre positif (ex. 12,50).",
      });
      return z.NEVER;
    }
    return cents;
  }),
  payerId: z.string("Le payeur est obligatoire.").min(1, "Le payeur est obligatoire."),
  participantIds: z
    .array(id, "Il faut au moins 1 participant.")
    .min(1, "Il faut au moins 1 participant."),
  date: z.iso.date("La date est invalide."),
});

export type ExpenseInput = z.input<typeof expenseSchema>;

/** Valide une entrée et lève une AppError avec le premier message d'erreur. */
export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError(result.error.issues[0]?.message ?? "Données invalides.");
  }
  return result.data;
}
