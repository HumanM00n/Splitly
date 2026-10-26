import { expect, test, type Page } from "@playwright/test";

async function addMember(page: Page, name: string) {
  await page.getByRole("textbox", { name: "Nom du membre" }).fill(name);
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.getByRole("button", { name: `Retirer ${name}` })).toBeVisible();
}

async function addExpense(
  page: Page,
  expense: { label: string; amount: string; payer: string; excluded?: string[] },
) {
  await page.getByRole("textbox", { name: "Libellé" }).fill(expense.label);
  await page.getByRole("textbox", { name: "Montant (€)" }).fill(expense.amount);
  await page.getByRole("combobox", { name: "Payé par" }).selectOption({ label: expense.payer });
  for (const name of expense.excluded ?? []) {
    await page.getByRole("checkbox", { name }).uncheck();
  }
  await page.getByRole("button", { name: "Ajouter la dépense" }).click();
  await expect(page.getByText(expense.label, { exact: true })).toBeVisible();
}

test("créer un groupe, 3 membres, 2 dépenses et voir les remboursements", async ({ page }) => {
  const groupName = `Vacances E2E ${Date.now()}`;

  await page.goto("/");
  await page.getByRole("textbox", { name: "Nom du groupe" }).fill(groupName);
  await page.getByRole("button", { name: "Créer" }).click();

  await expect(page.getByRole("heading", { level: 1, name: groupName })).toBeVisible();
  await expect(page.getByText("Tout le monde est quitte.")).toBeVisible();

  await addMember(page, "Alice");
  await addMember(page, "Bob");
  await addMember(page, "Chloé");

  // Alice paie 90 € pour les trois : Alice +60, Bob −30, Chloé −30
  await addExpense(page, { label: "Restaurant", amount: "90", payer: "Alice" });
  // Bob paie 30 € pour Bob et Chloé : Bob +15, Chloé −15
  await addExpense(page, { label: "Taxi", amount: "30,00", payer: "Bob", excluded: ["Alice"] });

  // Soldes : Alice +60, Bob −15, Chloé −45
  const settlements = page.getByTestId("settlements").getByRole("listitem");
  await expect(settlements).toHaveText(["Chloé doit 45,00 € à Alice", "Bob doit 15,00 € à Alice"]);

  // La plus récente en premier (même date : ordre de création)
  await expect(page.getByText(/^(Restaurant|Taxi)$/)).toHaveText(["Taxi", "Restaurant"]);
});
