import { captureStep, signIn, writeSideEffect } from "./evidence";

describe("bank accounts", () => {
  it("creates a bank account from the sidenav and soft-deletes it", () => {
    cy.task("db:seed");
    signIn("Heath93");
    cy.get("[data-test=user-onboarding-dialog]").should("not.exist");

    cy.get("[data-test=sidenav-bankaccounts]").click();
    cy.location("pathname").should("eq", "/bankaccounts");
    cy.get("[data-test=bankaccount-list]").should("be.visible");
    cy.contains("[data-test^=bankaccount-list-item]", "Waters, King and O'Reilly Bank").should(
      "be.visible"
    );
    captureStep("01-list");

    cy.get("[data-test=bankaccount-new]").click();
    cy.location("pathname").should("eq", "/bankaccounts/new");
    cy.get("[data-test=bankaccount-form]").should("be.visible");
    cy.get("[data-test=bankaccount-bankName-input]").type("The Best Bank");
    cy.get("[data-test=bankaccount-routingNumber-input]").type("987654321");
    cy.get("[data-test=bankaccount-accountNumber-input]").type("123456789");
    captureStep("02-form");

    cy.get("[data-test=bankaccount-submit]").click();
    cy.contains("[data-test^=bankaccount-list-item]", "The Best Bank").should("be.visible");
    cy.get("[data-test^=bankaccount-list-item]").should("have.length", 2);
    captureStep("03-created");

    cy.contains("[data-test^=bankaccount-list-item]", "The Best Bank")
      .find("[data-test=bankaccount-delete]")
      .click();
    cy.contains("[data-test^=bankaccount-list-item]", "The Best Bank").should(
      "contain",
      "(Deleted)"
    );
    captureStep("04-deleted");

    cy.reload();
    cy.contains("[data-test^=bankaccount-list-item]", "The Best Bank").should(
      "contain",
      "(Deleted)"
    );
    cy.contains("[data-test^=bankaccount-list-item]", "Waters, King and O'Reilly Bank").should(
      "not.contain",
      "(Deleted)"
    );
    captureStep("05-deleted-after-reload");

    cy.readFile("data/database.json").then((db) => {
      const created = db.bankaccounts.find(
        (entry: { userId: string; bankName: string }) =>
          entry.userId === "uBmeaz5pX" && entry.bankName === "The Best Bank"
      );
      const original = db.bankaccounts.find((entry: { id: string }) => entry.id === "pgl34JtnfhX");
      expect(created.isDeleted).to.eq(true);
      expect(original.isDeleted).to.eq(false);
      writeSideEffect({
        feature: "bank-accounts",
        entryPoint: "/bankaccounts/new",
        createdId: created.id,
        createdDeleted: created.isDeleted,
        originalId: original.id,
        originalDeleted: original.isDeleted,
      });
    });
  });
});
