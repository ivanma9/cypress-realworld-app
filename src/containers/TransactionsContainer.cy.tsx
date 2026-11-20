import { createMemoryHistory } from "history";
import { MemoryRouter, Router } from "react-router-dom";
import TransactionsContainer from "./TransactionsContainer";

const dateRangeChip = "[data-test='transaction-list-filter-date-range-button']";
const inMonthDay =
  ".react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth)";

function chipText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

describe("Transactions Container", () => {
  it("should not render transactions", () => {
    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <TransactionsContainer />
      </MemoryRouter>
    );
    cy.get("[data-test*=empty-list-header]").should("exist");
  });
  it("should render public transactions", () => {
    cy.intercept("http://localhost:3001/transactions/*", {
      fixture: "public-transactions.json",
    });
    cy.mount(
      <MemoryRouter initialEntries={["/"]}>
        <TransactionsContainer />
      </MemoryRouter>
    );
    cy.get("[data-test*=empty-list-header]").should("not.exist");
    cy.get(".MuiListSubheader-root").should("contain", "Public");
  });
  it("should render contacts transactions", () => {
    cy.intercept("http://localhost:3001/transactions/*", {
      fixture: "public-transactions.json",
    });
    cy.mount(
      <MemoryRouter initialEntries={["/contacts"]}>
        <TransactionsContainer />
      </MemoryRouter>
    );
    cy.get("[data-test*=empty-list-header]").should("not.exist");
    cy.get(".MuiListSubheader-root").should("contain", "Contacts");
  });
  it("should render personal transactions", () => {
    cy.intercept("http://localhost:3001/transactions", {
      fixture: "public-transactions.json",
    });
    cy.mount(
      <MemoryRouter initialEntries={["/personal"]}>
        <TransactionsContainer />
      </MemoryRouter>
    );
    cy.get("[data-test*=empty-list-header]").should("not.exist");
    cy.get(".MuiListSubheader-root").should("contain", "Personal");
  });

  it("keeps the formatted date range when switching feeds remounts the filter", () => {
    const history = createMemoryHistory({ initialEntries: ["/"] });
    cy.intercept("GET", "http://localhost:3001/transactions*", {
      fixture: "public-transactions.json",
    });

    cy.mount(
      <Router history={history}>
        <TransactionsContainer />
      </Router>
    );

    cy.get(dateRangeChip).should("contain", "ALL").click();
    cy.get(".react-calendar").should("be.visible");
    cy.get(inMonthDay).eq(0).click({ force: true });
    cy.get(inMonthDay).eq(2).click({ force: true });
    cy.get(".react-calendar").should("not.exist");
    cy.get(dateRangeChip)
      .should("not.contain", "undefined")
      .and("not.contain", "ALL")
      .invoke("text")
      .then((label) => chipText(label))
      .as("rangeLabel");

    const expectSameRange = (header: string) => {
      cy.get(".MuiListSubheader-root").should("contain", header);
      cy.get("@rangeLabel").then((rangeLabel) => {
        cy.get(dateRangeChip).should(($chip) => {
          const text = chipText($chip.text());
          expect(text).to.eq(rangeLabel);
          expect(text).to.not.contain("undefined");
        });
      });
    };

    cy.then(() => {
      history.push("/contacts");
    });
    expectSameRange("Contacts");

    cy.then(() => {
      history.push("/personal");
    });
    expectSameRange("Personal");

    cy.then(() => {
      history.push("/");
    });
    expectSameRange("Public");
  });
});
