// [FUNCTIONALITY TEST] Reservation Flow
// Target: ListingDetail page — house rules acceptance gate and reservation submission

describe("Reservation Flow", () => {
  beforeEach(() => {
    // NOTE: replace with a real seeded test tenant login before running
    cy.visit("/login");
    cy.get('input[type="email"]:visible').type(Cypress.env("TEST_TENANT_EMAIL") || "test.tenant@tierhome.com");
    cy.get('input[type="password"]:visible').type(Cypress.env("TEST_TENANT_PASSWORD") || "Password123");
    cy.contains("button:visible", "Sign In").click();
    cy.url({ timeout: 10000 }).should("include", "/browse");

    cy.visit("/browse");
    cy.contains("View Details", { timeout: 8000 }).first().click();
    cy.contains("button", "Reserve", { timeout: 8000 }).click();
  });

  it("blocks reservation submission until house rules & policies are accepted", () => {
    cy.contains("button", "Continue to Reservation").should("be.disabled");

    cy.get('input[type="checkbox"]').first().check();

    cy.contains("button", "Continue to Reservation").should("not.be.disabled");
  });

  it("proceeds to the reservation form once house rules & policies are accepted", () => {
    cy.get('input[type="checkbox"]').first().check();
    cy.contains("button", "Continue to Reservation").click();

    // Expected: the next step of the reservation flow becomes visible
    // (move-in date / notes fields, or the final Reserve action)
    cy.get('input[type="date"], textarea', { timeout: 8000 }).should("exist");
  });
});
