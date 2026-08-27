// [FUNCTIONALITY TEST] Login
// Target: Login page (web) — email/password authentication flow
//
// NOTE: the page renders two email/password form instances in the DOM
// simultaneously (a common responsive-layout pattern where one is hidden
// via CSS rather than not rendered at all). :visible filters to the one
// actually shown to the user, matching real user interaction.

describe("Login", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("shows an error message when submitting invalid credentials", () => {
    cy.get('input[type="email"]:visible').type("nonexistent_user@example.com");
    cy.get('input[type="password"]:visible').type("WrongPassword123");
    cy.contains("button:visible", "Sign In").click();

    // Expected: an error message appears, user is NOT redirected away from /login
    cy.contains(/invalid email or password/i, { timeout: 8000 }).should("be.visible");
    cy.url().should("include", "/login");
  });

  it("requires both email and password before allowing submission", () => {
    // Browser-native "required" validation should block submission with empty fields
    cy.contains("button:visible", "Sign In").click();
    cy.url().should("include", "/login"); // should not navigate away
  });

  it("successfully logs in a tenant with valid credentials and redirects to the dashboard", () => {
    // NOTE: replace with a real seeded test tenant account before running
    cy.get('input[type="email"]:visible').type(Cypress.env("TEST_TENANT_EMAIL") || "test.tenant@tierhome.com");
    cy.get('input[type="password"]:visible').type(Cypress.env("TEST_TENANT_PASSWORD") || "Password123");
    cy.contains("button:visible", "Sign In").click();

    cy.url({ timeout: 10000 }).should("include", "/browse");
  });
});
