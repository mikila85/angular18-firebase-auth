/// <reference types="cypress" />

// this test behaves as the second user to join the chat
it('chats with the first user', () => {
  cy.task('waitForCheckpoint', 'first user has joined')

  const name = 'Second'
  // we are chatting with the first user
  const firstName = 'First'
  cy.visit('/event/bYcIw5xCPieUgrRj4BaM')
  cy.get('[data-cy="signInEmail"]').type('teambldrtest+second@gmail.com')
  cy.get('[data-cy="signInPassword"]').type('SecondTesterCypressPair')
  cy.get('[data-cy="signInLoginBtn"]').click()

  cy.get('[data-cy="eventCardTitle"]').contains('Cypress Pair Test')
  cy.get('[data-cy="messagesTabTitle"]').click()

  /*
  // make sure the greeting message is shown
  cy.contains('#messages li i', `${name} join the chat..`).should('be.visible')
  cy.task('checkpoint', 'second user has joined')

  cy.get('#txt').type('Good to see you{enter}')

  // a message from the first user arrives
  cy.contains('#messages li', 'Glad to be here').contains('strong', firstName)
  cy.task('checkpoint', 'second user saw glad to be here')

  // the first user will disconnect now
  cy.contains('#messages li i', `${firstName} left the chat..`).should(
    'be.visible',
  )
  cy.task('checkpoint', 'second user saw first user leave')
  */
})
