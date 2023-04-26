/// <reference types="cypress" />

// this test behaves as the first user to join the chat
it('first user creates event and invites the second user', () => {

  cy.visit('/')
  cy.get('[data-cy="homeBtn"]')
  cy.get('[data-cy="createNewEventBtn"]').contains('Create New Event')
  cy.get('[data-cy="signInBtn"]').click()
  cy.get('[data-cy="googleBtn"]').contains('Google')
  cy.get('[data-cy="signInEmail"]').type('teambldrtest+first@gmail.com')
  cy.readFile('cypress.data.json').its('firstUserPassword').then((password) => {
    cy.get('[data-cy="signInPassword"]').type(password)
  })
  cy.get('[data-cy="signInLoginBtn"]').click()
  cy.get('[data-cy="createNewEventBtn"]').click()
  cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 0')
  cy.get('[data-cy="waitlistTab"]').should('not.exist')
  cy.get('[data-cy="eventTitle"]').type('Cypress Test Event Title')
  cy.get('[data-cy="eventDescription"]').type('Cypress Test Event Description')
  cy.get('[data-cy="attendeeLimitToggle"]').click()
  cy.get('[data-cy="maxAttendeesField"]').click()
  cy.get('[data-cy="maxAttendees"]').type('5')
  cy.get('[data-cy="attendeesTabTitle"]').contains('/5')
  cy.get('[data-cy="eventJoinBtn"]').contains('JOIN').click()
  cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 1/5')
  cy.get('.mat-mdc-list-item').contains('First Tester')
  cy.get('[data-cy="messagesTabTitle"]').click()
  cy.get('[data-cy="messageInput"]').type('First test message')
  cy.get('[data-cy="sendMessageBtn"]').click()
  cy.get('p').contains('First test message')
  cy.url().then((url) => {
    cy.wrap(url).as('testEventUrl');
    cy.readFile("cypress.data.json").then((data) => {
      data.testEventUrl = url
      cy.writeFile("cypress.data.json", data)
    })
  })
  cy.get('[data-cy="homeBtn"]').click()
  cy.get('.mat-mdc-list-item-title').contains('Cypress Test Event Title').click()
  cy.get('@testEventUrl').then((testEventUrl) => {
    cy.url().should('eq', testEventUrl)
  })
  cy.get('[data-cy="eventDescription"]').should('have.value', 'Cypress Test Event Description')
  cy.get('[data-cy="eventInviteBtn"]').click()

  cy.task('checkpoint', 'first user created new event')
  cy.task('waitForCheckpoint', 'second user has joined')
})
