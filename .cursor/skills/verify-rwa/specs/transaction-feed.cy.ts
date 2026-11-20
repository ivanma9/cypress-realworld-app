import { captureStep, signIn, writeSideEffect } from "./evidence";

describe("transaction feed", () => {
  it("switches feeds, picks a date range on the calendar, and opens the amount slider", () => {
    cy.task("db:seed");
    signIn("Heath93");

    cy.get("[data-test=nav-public-tab]").should("have.class", "Mui-selected");
    cy.get("[data-test=transaction-list-filter-date-range-button]").should("contain", "ALL");
    cy.get("[data-test^=transaction-item]").should("have.length", 10);
    captureStep("01-everyone");

    cy.get("[data-test=nav-contacts-tab]").click();
    cy.location("pathname").should("eq", "/contacts");
    cy.get("[data-test=nav-contacts-tab]").should("have.class", "Mui-selected");
    cy.get("[data-test=list-skeleton]").should("not.exist");
    cy.get("[data-test=transaction-list]").should("be.visible");
    captureStep("02-friends");

    cy.get("[data-test=nav-personal-tab]").click();
    cy.location("pathname").should("eq", "/personal");
    cy.get("[data-test=nav-personal-tab]").should("have.class", "Mui-selected");
    cy.get("[data-test=list-skeleton]").should("not.exist");
    cy.get("[data-test=transaction-list]").should("be.visible");
    captureStep("03-mine");

    cy.get("[data-test=nav-public-tab]").click();
    cy.location("pathname").should("eq", "/");
    cy.get("[data-test=list-skeleton]").should("not.exist");

    cy.get("[data-test=transaction-list-filter-date-range-button]").click();
    cy.get(".react-calendar").should("be.visible");
    captureStep("04-date-calendar");
    cy.intercept("GET", "/transactions/public*").as("filteredPublic");
    cy.get(
      ".react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth)"
    )
      .eq(0)
      .click();
    cy.get(
      ".react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth)"
    )
      .eq(2)
      .click();
    cy.get(".react-calendar").should("not.exist");
    cy.get("[data-test=transaction-list-filter-date-range-button]")
      .should("not.contain", "undefined")
      .and("not.contain", "ALL")
      .and("contain", "Date:");
    cy.wait("@filteredPublic").its("request.url").should("include", "dateRangeStart");
    cy.get("[data-test=empty-list-header]").should("contain", "No Transactions");
    captureStep("05-date-filtered");

    cy.get("[data-test=transaction-list-filter-date-clear-button]").click({ force: true });
    cy.get("[data-test=transaction-list-filter-date-range-button]").should("contain", "ALL");
    cy.get("[data-test=list-skeleton]").should("not.exist");
    cy.get("[data-test^=transaction-item]").should("have.length", 10);
    captureStep("06-date-cleared");

    cy.get("[data-test=transaction-list-filter-amount-range-button]").scrollIntoView();
    cy.get("[data-test=transaction-list-filter-amount-range-button]").click();
    cy.get("[data-test=transaction-list-filter-amount-range-text]").should(
      "contain",
      "Amount Range:"
    );
    cy.get("[data-test=transaction-list-filter-amount-range-slider]").should("be.visible");
    captureStep("07-amount-slider");

    writeSideEffect({
      feature: "transaction-feed",
      entryPoint: "/",
      pageSize: 10,
      dateChipAfterCalendarPickContainsUndefined: false,
      emptyRangeHeader: "No Transactions",
      amountSliderOpened: true,
    });
  });
});
