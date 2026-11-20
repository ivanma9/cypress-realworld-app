import { captureStep, signIn, writeSideEffect } from "./evidence";

const dateChip = "[data-test=transaction-list-filter-date-range-button]";
const formattedRange = /^Date: [A-Z][a-z]{2}, \d{1,2} \d{4} - [A-Z][a-z]{2}, \d{1,2} \d{4}$/;

function chipText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

describe("transaction feed", () => {
  it("switches feeds, picks a date range on the calendar, and opens the amount slider", () => {
    const observed = {
      afterPick: "",
      afterFriends: "",
      afterMine: "",
      afterEveryone: "",
    };
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

    cy.get(dateChip).click();
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
    cy.get(dateChip).should(($chip) => {
      const text = chipText($chip.text());
      expect(text, "date chip after calendar pick").to.match(formattedRange);
      observed.afterPick = text;
    });
    cy.wait("@filteredPublic").its("request.url").should("include", "dateRangeStart");
    cy.get("[data-test=empty-list-header]").should("contain", "No Transactions");
    captureStep("05-date-filtered");

    cy.then(() => {
      const pickedRange = observed.afterPick;

      cy.intercept("GET", "/transactions/contacts*").as("filteredContacts");
      cy.get("[data-test=nav-contacts-tab]").click();
      cy.location("pathname").should("eq", "/contacts");
      cy.get("[data-test=nav-contacts-tab]").should("have.class", "Mui-selected");
      cy.wait("@filteredContacts").its("request.url").should("include", "dateRangeStart");
      cy.get("[data-test=list-skeleton]").should("not.exist");
      cy.get(dateChip).should(($chip) => {
        const text = chipText($chip.text());
        expect(text, "date chip after Friends").to.eq(pickedRange);
        observed.afterFriends = text;
      });
      captureStep("06-date-on-friends");

      cy.intercept("GET", /\/transactions\?/).as("filteredPersonal");
      cy.get("[data-test=nav-personal-tab]").click();
      cy.location("pathname").should("eq", "/personal");
      cy.get("[data-test=nav-personal-tab]").should("have.class", "Mui-selected");
      cy.wait("@filteredPersonal").its("request.url").should("include", "dateRangeStart");
      cy.get("[data-test=list-skeleton]").should("not.exist");
      cy.get(dateChip).should(($chip) => {
        const text = chipText($chip.text());
        expect(text, "date chip after Mine").to.eq(pickedRange);
        observed.afterMine = text;
      });
      captureStep("07-date-on-mine");

      cy.intercept("GET", "/transactions/public*").as("filteredPublicAgain");
      cy.get("[data-test=nav-public-tab]").click();
      cy.location("pathname").should("eq", "/");
      cy.get("[data-test=nav-public-tab]").should("have.class", "Mui-selected");
      cy.wait("@filteredPublicAgain").its("request.url").should("include", "dateRangeStart");
      cy.get("[data-test=list-skeleton]").should("not.exist");
      cy.get(dateChip).should(($chip) => {
        const text = chipText($chip.text());
        expect(text, "date chip back on Everyone").to.eq(pickedRange);
        observed.afterEveryone = text;
      });
      captureStep("08-date-on-everyone");

      cy.get("[data-test=transaction-list-filter-date-clear-button]").click({ force: true });
      cy.get(dateChip).should("contain", "ALL");
      cy.get("[data-test=list-skeleton]").should("not.exist");
      cy.get("[data-test^=transaction-item]").should("have.length", 10);
      captureStep("09-date-cleared");

      cy.get("[data-test=transaction-list-filter-amount-range-button]").scrollIntoView();
      cy.get("[data-test=transaction-list-filter-amount-range-button]").click();
      cy.get("[data-test=transaction-list-filter-amount-range-text]").should(
        "contain",
        "Amount Range:"
      );
      cy.get("[data-test=transaction-list-filter-amount-range-slider]").should("be.visible");
      captureStep("10-amount-slider");

      cy.then(() => {
        writeSideEffect({
          feature: "transaction-feed",
          entryPoint: "/",
          pageSize: 10,
          dateChipAfterCalendarPick: observed.afterPick,
          dateChipAfterFriendsTab: observed.afterFriends,
          dateChipAfterMineTab: observed.afterMine,
          dateChipAfterReturnToEveryone: observed.afterEveryone,
          dateChipAfterCalendarPickContainsUndefined: observed.afterPick.includes("undefined"),
          dateChipAfterTabSwitchContainsUndefined: [
            observed.afterFriends,
            observed.afterMine,
            observed.afterEveryone,
          ].some((label) => label.includes("undefined")),
          emptyRangeHeader: "No Transactions",
          amountSliderOpened: true,
        });
      });
    });
  });
});
