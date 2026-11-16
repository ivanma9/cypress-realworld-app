import { captureStep, signIn, signOut, writeSideEffect } from "./evidence";

describe("notifications", () => {
  beforeEach(() => {
    cy.task("db:seed");
  });

  it("opens the unread list and dismisses one notification", () => {
    signIn("Heath93");
    cy.get("[data-test=nav-top-notifications-count]").should("have.text", "8");
    captureStep("01-badge");

    cy.get("[data-test=nav-top-notifications-link]").click();
    cy.location("pathname").should("eq", "/notifications");
    cy.contains("h2", "Notifications").should("be.visible");
    cy.get("[data-test^=notification-list-item]").should("have.length", 8);
    captureStep("02-list");

    cy.get("[data-test^=notification-list-item]")
      .first()
      .invoke("attr", "data-test")
      .then((attr) => {
        const id = String(attr).replace("notification-list-item-", "");
        cy.get(`[data-test=notification-mark-read-${id}]`).click();
        cy.get("[data-test^=notification-list-item]").should("have.length", 7);
        cy.get(`[data-test=notification-list-item-${id}]`).should("not.exist");
        captureStep("03-dismissed");

        cy.reload();
        cy.get("[data-test^=notification-list-item]").should("have.length", 7);
        cy.get(`[data-test=notification-list-item-${id}]`).should("not.exist");
        captureStep("04-dismissed-after-reload");

        cy.readFile("data/database.json").then((db) => {
          const row = db.notifications.find((entry: { id: string }) => entry.id === id);
          const unread = db.notifications.filter(
            (entry: { userId: string; isRead: boolean }) =>
              entry.userId === "uBmeaz5pX" && entry.isRead === false
          );
          expect(row.isRead).to.eq(true);
          expect(unread).to.have.length(7);
          writeSideEffect(
            {
              feature: "notifications",
              entryPoint: "/notifications",
              action: "dismiss",
              notificationId: id,
              isRead: row.isRead,
              unreadRemaining: unread.length,
            },
            "side-effect-dismiss.json"
          );
        });
      });
  });

  it("likes and comments on a transaction, then the other person sees both notifications", () => {
    cy.readFile("data/database.json").then((db) => {
      const heath = db.users.find((entry: { username: string }) => entry.username === "Heath93");
      const liked = new Set(
        db.likes
          .filter((entry: { userId: string }) => entry.userId === heath.id)
          .map((entry: { transactionId: string }) => entry.transactionId)
      );
      const transaction = db.transactions.find(
        (entry: { id: string; senderId: string; receiverId: string }) =>
          entry.senderId !== heath.id && entry.receiverId !== heath.id && !liked.has(entry.id)
      );
      const sender = db.users.find((entry: { id: string }) => entry.id === transaction.senderId);
      expect(transaction, "a public-or-any transaction Heath has not liked").to.exist;
      cy.wrap({
        transactionId: transaction.id,
        senderUsername: sender.username,
      }).as("target");
    });

    cy.get("@target").then((target: unknown) => {
      const { transactionId, senderUsername } = target as {
        transactionId: string;
        senderUsername: string;
      };
      signIn("Heath93");
      cy.visit(`/transaction/${transactionId}`);
      cy.get("[data-test=transaction-detail-header]").should("be.visible");
      cy.get(`[data-test^=transaction-like-button-]`).should("not.be.disabled");
      captureStep("05-transaction-detail");

      cy.get(`[data-test^=transaction-like-button-]`).click();
      cy.get(`[data-test^=transaction-like-button-]`).should("be.disabled");
      cy.get(`[data-test^=transaction-comment-input-]`).type("Verification comment{enter}");
      cy.get("[data-test=comments-list]").should("contain", "Verification comment");
      captureStep("06-liked-and-commented");

      signOut();
      signIn(senderUsername);
      cy.get("[data-test=nav-top-notifications-link]").click();
      cy.location("pathname").should("eq", "/notifications");
      cy.get("[data-test^=notification-list-item]")
        .first()
        .should("contain", "Ted Parisian")
        .and("contain", "commented");
      cy.get("[data-test=notifications-list]").should("contain", "liked");
      captureStep("07-counterparty-notifications");

      cy.readFile("data/database.json").then((db) => {
        const like = db.likes.find(
          (entry: { userId: string; transactionId: string }) =>
            entry.userId === "uBmeaz5pX" && entry.transactionId === transactionId
        );
        const comment = db.comments.find(
          (entry: { userId: string; transactionId: string; content: string }) =>
            entry.userId === "uBmeaz5pX" &&
            entry.transactionId === transactionId &&
            entry.content === "Verification comment"
        );
        expect(like, "like row").to.exist;
        expect(comment, "comment row").to.exist;
        writeSideEffect(
          {
            feature: "notifications",
            entryPoint: `/transaction/${transactionId}`,
            action: "like-and-comment",
            transactionId,
            counterparty: senderUsername,
            likeId: like.id,
            commentId: comment.id,
          },
          "side-effect-like.json"
        );
      });
    });
  });
});
