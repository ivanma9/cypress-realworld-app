import { captureStep, writeSideEffect } from "./evidence";

describe("sign in", () => {
  it("signs in through the form, keeps the session, and signs out", () => {
    cy.task("db:seed");

    cy.visit("/personal");
    cy.location("pathname").should("eq", "/signin");
    cy.title().should("eq", "Cypress Real World App");
    cy.contains("h1", "Sign in").should("be.visible");
    captureStep("01-redirected-to-sign-in");

    cy.get("[data-test=signin-username]").type("Heath93");
    cy.get("[data-test=signin-password]").type("INVALID");
    cy.get("[data-test=signin-submit]").click();
    cy.get("[data-test=signin-error]")
      .should("be.visible")
      .and("have.text", "Username or password is invalid");
    captureStep("02-rejected-password");

    cy.get("[data-test=signin-username]").find("input").clear();
    cy.get("[data-test=signin-username]").type("Heath93");
    cy.get("[data-test=signin-password]").find("input").clear();
    cy.get("[data-test=signin-password]").type("s3cret");
    cy.get("[data-test=signin-remember-me]").find("input").check();
    cy.get("[data-test=signin-submit]").click();
    cy.location("pathname").should("eq", "/");
    cy.get("[data-test=sidenav-username]").should("have.text", "@Heath93");
    cy.get("[data-test=sidenav-user-full-name]").should("have.text", "Ted P");
    cy.get("[data-test=sidenav-user-balance]").should("contain", "$1,509.53");
    cy.get("[data-test=list-skeleton]").should("not.exist");
    cy.getCookie("connect.sid").should("have.property", "expiry");
    captureStep("03-signed-in");

    cy.reload();
    cy.get("[data-test=sidenav-username]").should("have.text", "@Heath93");
    cy.get("[data-test=sidenav-user-balance]").should("contain", "$1,509.53");
    captureStep("04-session-after-reload");

    cy.get("[data-test=sidenav-signout]").click();
    cy.location("pathname").should("eq", "/signin");
    cy.contains("h1", "Sign in").should("be.visible");
    captureStep("05-signed-out");

    cy.readFile("data/database.json").then((db) => {
      const user = db.users.find((entry: { username: string }) => entry.username === "Heath93");
      expect(user.balance).to.eq(150953);
      writeSideEffect({
        feature: "sign-in",
        entryPoint: "/signin",
        username: user.username,
        userId: user.id,
        balanceCents: user.balance,
        sessionSurvivedReload: true,
        signedOutPath: "/signin",
      });
    });
  });
});
