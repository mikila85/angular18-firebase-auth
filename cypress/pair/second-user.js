/// <reference types="cypress" />

// this test behaves as the second user to join the chat
it('second user joins event', () => {
  cy.task('waitForCheckpoint', 'first user created new event')

  cy.readFile('cypress.data.json').then((data) => {
    cy.wrap(data).as('testData')
    cy.visit(data.testEventUrl)
    cy.get('[data-cy="signInEmail"]').type('teambldrtest+second@gmail.com')
    cy.get('[data-cy="signInPassword"]').type(data.secondUserPassword)
    cy.get('[data-cy="signInLoginBtn"]').click()
  })

  cy.get('[data-cy="eventCardTitle"]').contains('Cypress Test Event Title')
  cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 1/5')
  cy.get('[data-cy="messagesTabTitle"]').click()
  cy.get('p').contains('First test message')
  cy.task('checkpoint', 'second user has joined')
})
