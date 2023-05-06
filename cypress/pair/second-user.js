/// <reference types="cypress" />

// this test behaves as the second user to join the chat
it('second user joins event', () => {
  cy.task('waitForCheckpoint', 'first user created new event')

  // log in as second user
  cy.readFile('cypress.data.json').then((data) => {
    cy.wrap(data).as('testData')
    cy.visit(data.testEventUrl)
    cy.get('[data-cy="signInEmail"]').type('teambldrtest+second@gmail.com')
    cy.get('[data-cy="signInPassword"]').type(data.secondUserPassword)
    cy.get('[data-cy="signInLoginBtn"]').click()
  })

  cy.get('[data-cy="eventCardTitle"]').contains('Cypress Test Event Title')
  cy.get('[data-cy="readOnlyModeBtn"]').should('not.exist')
  cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 1/5')
  cy.get('.mat-mdc-list-item').contains('First Tester')
  // Reject event
  cy.get('[data-cy="notGoingSubheader"]').should('not.exist')
  cy.get('[data-cy="eventJoinBtn"]').contains('JOIN')
  cy.get('[data-cy="notGoingBtn"]').contains('Not Going').click()
  cy.get('[data-cy="notGoingSubheader"]').should('contain', 'Not Going 1')
  cy.get('.mat-mdc-list-item').contains('Second Tester')
  cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 1/5')
  // join event
  cy.get('[data-cy="eventJoinBtn"]').contains('JOIN').click()
  cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 2/5')
  cy.get('.mat-mdc-list-item').contains('Second Tester')
  // check messages
  cy.get('[data-cy="messagesTabTitle"]').should('not.have.class', 'mat-badge-hidden')
  cy.get('[data-cy="messagesTabTitle"]').click()
  cy.get('p').contains('First test message')
  cy.get('[data-cy="messagesTabTitle"]').should('have.class', 'mat-badge-hidden')
  cy.get('[data-cy="messageInput"]').type('Second test message')
  cy.get('[data-cy="sendMessageBtn"]').click()
  cy.task('checkpoint', 'second user has joined')

  cy.task('waitForCheckpoint', 'attendees limited to 1')
  cy.get('[data-cy="messagesTabTitle"]').should('have.class', 'mat-badge-hidden')
  cy.get('[data-cy="notGoingBtn"]').contains('Not Going').click()
  cy.wait(500)
  cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 1/1')
  cy.get('[data-cy="eventWaitlistBtn"]').contains('JOIN WAITLIST').click()
  cy.wait(500)
  cy.get('[data-cy="waitlistTabTitle"]').contains('Waitlist 1').click()
  cy.get('.mat-mdc-list-item').contains('Second Tester')
  cy.get('[data-cy="messagesTabTitle"]').click()
  cy.get('[data-cy="messageInput"]').type('Joined waitlist')
  cy.get('[data-cy="sendMessageBtn"]').click()
  cy.task('checkpoint', 'second user has joined waitlist')

  cy.task('waitForCheckpoint', 'first user left event')
  cy.get('[data-cy="waitlistTab"]').should('not.exist')
  cy.get('[data-cy="notGoingBtn"]').should('exist')
  cy.get('[data-cy="attendeesTabTitle"]').click()
  cy.get('.mat-mdc-list-item').contains('Second Tester')
  // leave event
  cy.get('[data-cy="notGoingBtn"]').contains('Not Going').click()
  cy.get('[data-cy="homeBtn"]').click()
  cy.task('checkpoint', 'second user left')

})
