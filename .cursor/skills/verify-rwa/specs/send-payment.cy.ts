import { captureStep, signIn, writeSideEffect } from "./evidence";

const senderId = "uBmeaz5pX";
const receiverId = "GjWovtg2hr";
const senderBalance = 150953;
const receiverBalance = 93026;

describe("send or request a payment", () => {
  beforeEach(() => {
    cy.task("db:seed");
  });

  it("pays Kristian Bradtke from the new transaction form and shows the payment on Mine", () => {
    const note = `Verify payment ${Date.now()}`;
    const amountDollars = 35;
    const amountCents = amountDollars * 100;

    cy.intercept("POST", "/transactions").as("createTransaction");
    signIn("Heath93");
    captureStep("01-signed-in");

    cy.get("[data-test=nav-top-new-transaction]").click();
    cy.location("pathname").should("eq", "/transaction/new");
    cy.get("[data-test=user-list-search-input]").type("Kristian");
    cy.contains("[data-test^=user-list-item]", "Kristian Bradtke").click();
    cy.get("[data-test=transaction-create-amount-input]").type(String(amountDollars));
    cy.get("[data-test=transaction-create-description-input]").type(note);
    captureStep("02-payment-form");

    cy.get("[data-test=transaction-create-submit-payment]").click();
    cy.wait("@createTransaction");
    cy.get("[data-test=alert-bar-success]")
      .should("be.visible")
      .and("contain", "Transaction Submitted!");
    cy.contains("h2", note).should("contain", "Paid");
    cy.get("[data-test=sidenav-user-balance]").should("contain", "$1,474.53");
    captureStep("03-payment-submitted");

    cy.get("[data-test=new-transaction-return-to-transactions]").click();
    cy.get("[data-test=nav-personal-tab]").click();
    cy.location("pathname").should("eq", "/personal");
    cy.get("[data-test=nav-personal-tab]").should("have.class", "Mui-selected");
    cy.get("[data-test=list-skeleton]").should("not.exist");
    cy.get("[data-test=transaction-list]").should("contain", note);
    captureStep("04-mine-feed");

    cy.reload();
    cy.get("[data-test=nav-personal-tab]").click();
    cy.get("[data-test=list-skeleton]").should("not.exist");
    cy.get("[data-test=transaction-list]").should("contain", note);
    captureStep("05-mine-feed-after-reload");

    cy.readFile("data/database.json").then((db) => {
      const sender = db.users.find((entry: { id: string }) => entry.id === senderId);
      const receiver = db.users.find((entry: { id: string }) => entry.id === receiverId);
      const transaction = db.transactions.find(
        (entry: { description: string }) => entry.description === note
      );
      expect(sender.balance).to.eq(senderBalance - amountCents);
      expect(receiver.balance).to.eq(receiverBalance + amountCents);
      expect(transaction.amount).to.eq(amountCents);
      expect(transaction.senderId).to.eq(senderId);
      expect(transaction.receiverId).to.eq(receiverId);
      expect(transaction.status).to.eq("complete");
      const notification = db.notifications.find(
        (entry: { transactionId: string; userId: string }) =>
          entry.transactionId === transaction.id && entry.userId === receiverId
      );
      expect(notification, "receiver payment notification").to.exist;
      writeSideEffect({
        feature: "send-payment",
        entryPoint: "/transaction/new",
        action: "payment",
        note,
        amountCents,
        sender: { id: sender.id, username: sender.username, balanceCents: sender.balance },
        receiver: { id: receiver.id, username: receiver.username, balanceCents: receiver.balance },
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status,
          senderId: transaction.senderId,
          receiverId: transaction.receiverId,
          description: transaction.description,
        },
        receiverNotificationId: notification.id,
      });
    });
  });

  it("requests money from Kristian Bradtke and leaves both balances unchanged", () => {
    const note = `Verify request ${Date.now()}`;

    cy.intercept("POST", "/transactions").as("createTransaction");
    signIn("Heath93");
    cy.get("[data-test=nav-top-new-transaction]").click();
    cy.get("[data-test=user-list-search-input]").type("Kristian");
    cy.contains("[data-test^=user-list-item]", "Kristian Bradtke").click();
    cy.get("[data-test=transaction-create-amount-input]").type("95");
    cy.get("[data-test=transaction-create-description-input]").type(note);
    captureStep("06-request-form");

    cy.get("[data-test=transaction-create-submit-request]").click();
    cy.wait("@createTransaction");
    cy.get("[data-test=alert-bar-success]").should("contain", "Transaction Submitted!");
    cy.contains("h2", note).should("contain", "Requested");
    cy.get("[data-test=sidenav-user-balance]").should("contain", "$1,509.53");
    captureStep("07-request-submitted");

    cy.get("[data-test=new-transaction-return-to-transactions]").click();
    cy.get("[data-test=nav-personal-tab]").click();
    cy.get("[data-test=list-skeleton]").should("not.exist");
    cy.get("[data-test=transaction-list]").should("contain", note);
    captureStep("08-request-on-mine");

    cy.readFile("data/database.json").then((db) => {
      const sender = db.users.find((entry: { id: string }) => entry.id === senderId);
      const receiver = db.users.find((entry: { id: string }) => entry.id === receiverId);
      const transaction = db.transactions.find(
        (entry: { description: string }) => entry.description === note
      );
      expect(sender.balance).to.eq(senderBalance);
      expect(receiver.balance).to.eq(receiverBalance);
      expect(transaction.amount).to.eq(9500);
      expect(transaction.requestStatus).to.eq("pending");
      expect(transaction.status).to.eq("pending");
      writeSideEffect(
        {
          feature: "send-payment",
          entryPoint: "/transaction/new",
          action: "request",
          note,
          amountCents: 9500,
          senderBalanceCents: sender.balance,
          receiverBalanceCents: receiver.balance,
          transactionId: transaction.id,
          requestStatus: transaction.requestStatus,
          status: transaction.status,
        },
        "side-effect-request.json"
      );
    });
  });
});
