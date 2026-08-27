// [FUNCTIONALITY TEST] Affordability Ranking
// Target: Ranking page — income/expense input, disposable income calculation,
// and affordability-tiered listing results

describe("Affordability Ranking", () => {
  beforeEach(() => {
    // NOTE: replace with a real seeded test tenant login before running
    cy.visit("/login");
    cy.get('input[type="email"]:visible').type(Cypress.env("TEST_TENANT_EMAIL") || "test.tenant@tierhome.com");
    cy.get('input[type="password"]:visible').type(Cypress.env("TEST_TENANT_PASSWORD") || "Password123");
    cy.contains("button:visible", "Sign In").click();
    cy.url({ timeout: 10000 }).should("include", "/browse");

    cy.visit("/tenant/ranking");
  });

  it("computes disposable income and max recommended rent from valid input", () => {
    cy.contains("Gross Monthly Income").parent().find("input").type("25000");
    cy.contains("Monthly Expenses").parent().find("input").type("8500");
    cy.contains("Available Savings").first().parent().find("input").type("35000");

    // Confirm the required truthfulness checkbox before submitting
    cy.get('input[type="checkbox"]').check();

    cy.contains("button", "Calculate My Affordability").click();

    // Expected: Disposable Income = 25,000 - 8,500 = 16,500
    // Expected: Max Recommended Rent (30%) = 4,950
    cy.contains("₱16,500", { timeout: 8000 }).should("be.visible");
    cy.contains("₱4,950").should("be.visible");
  });

  it("blocks submission until the truthfulness checkbox is confirmed", () => {
    cy.contains("Gross Monthly Income").parent().find("input").type("25000");
    cy.contains("Monthly Expenses").parent().find("input").type("8500");
    cy.contains("Available Savings").first().parent().find("input").type("35000");

    // Deliberately leave the checkbox unchecked
    cy.contains("button", "Calculate My Affordability").should("be.disabled");
  });

  it("displays the PSA national income context alongside the results", () => {
    cy.contains("Gross Monthly Income").parent().find("input").type("25000");
    cy.contains("Monthly Expenses").parent().find("input").type("8500");
    cy.contains("Available Savings").first().parent().find("input").type("35000");
    cy.get('input[type="checkbox"]').check();
    cy.contains("button", "Calculate My Affordability").click();

    cy.contains(/Average Family Income/i, { timeout: 8000 }).should("be.visible");
    cy.contains(/Philippine Statistics Authority/i).should("be.visible");
  });
});
