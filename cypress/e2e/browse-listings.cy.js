// [FUNCTIONALITY TEST] Browse Listings
// Target: Browse page (ListingGrid + ListingCard) — public listing discovery

describe("Browse Listings", () => {
  it("displays at least one listing card to an anonymous (logged-out) visitor", () => {
    cy.visit("/browse");

    cy.contains("Available Rentals in Angeles City").should("be.visible");

    // At least one listing card should render, showing a "View Details" action
    cy.contains("View Details", { timeout: 8000 }).should("exist");
  });

  it("navigates to a listing's detail page when 'View Details' is clicked", () => {
    cy.visit("/browse");

    cy.contains("View Details", { timeout: 8000 }).first().click();

    // Expected: URL changes to a specific listing route, and detail content loads
    cy.url().should("include", "/listing");
    cy.contains(/verified/i, { timeout: 8000 }).should("be.visible");
  });
});
