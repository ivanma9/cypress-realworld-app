// Selectors here match .cursor/skills/verify-rwa/features/*.md.
// Sign-in types the real form. It does not call loginByApi or loginByXstate.

export function evidenceDir(): string {
  const dir = Cypress.expose("VERIFY_RWA_EVIDENCE");
  if (!dir || typeof dir !== "string") {
    throw new Error(
      "VERIFY_RWA_EVIDENCE is not set. Run .cursor/skills/verify-rwa/bin/verify-rwa drive <feature>."
    );
  }
  return dir;
}

export function captureStep(name: string) {
  cy.screenshot(name);
  cy.get("body")
    .then(($body) => {
      const lines: string[] = [];
      $body.find("h1, h2, button, a, input, [data-test]").each((_, el) => {
        const testId = el.getAttribute("data-test") || "";
        const role = el.getAttribute("role") || el.tagName.toLowerCase();
        const text = (
          el.innerText ||
          el.getAttribute("placeholder") ||
          el.getAttribute("aria-label") ||
          ""
        )
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 120);
        lines.push(`${role}\t${testId}\t${text}`);
      });
      return `${lines.join("\n")}\n`;
    })
    .then((text) => {
      cy.writeFile(`${evidenceDir()}/${name}.aria.txt`, text);
    });
}

export function writeSideEffect(payload: unknown, fileName = "side-effect.json") {
  cy.writeFile(`${evidenceDir()}/${fileName}`, payload);
}

export function signIn(username: string) {
  cy.visit("/signin");
  cy.title().should("eq", "Cypress Real World App");
  cy.get("[data-test=signin-username]").type(username);
  cy.get("[data-test=signin-password]").type("s3cret");
  cy.get("[data-test=signin-submit]").click();
  cy.location("pathname").should("eq", "/");
  cy.get("[data-test=sidenav-username]").should("contain", `@${username}`);
  cy.get("[data-test=sidenav-user-balance]").should("contain", "$");
  cy.get("[data-test=list-skeleton]").should("not.exist");
}

export function signOut() {
  cy.get("[data-test=sidenav-signout]").click();
  cy.location("pathname").should("eq", "/signin");
}
