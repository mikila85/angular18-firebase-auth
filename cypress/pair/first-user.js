/// <reference types="cypress" />

// this test behaves as the first user to join the chat
it('first user creates event and invites the second user', () => {

  cy.readFile('cypress.data.json').its('homeUrl').then((homeUrl) => {
    cy.visit(homeUrl)
  })
  // log in as first user
  cy.get('[data-cy="homeBtn"]')
  cy.get('[data-cy="createNewEventBtn"]').contains('Create New Event')
  cy.get('[data-cy="signInBtn"]').click()
  cy.get('[data-cy="googleBtn"]').contains('Google')
  cy.get('[data-cy="signInEmail"]').type('teambldrtest+first@gmail.com')
  cy.readFile('cypress.data.json').its('firstUserPassword').then((password) => {
    cy.get('[data-cy="signInPassword"]').type(password)
  })
  cy.get('[data-cy="signInLoginBtn"]').click()
  // create new event
  cy.get('[data-cy="createNewEventBtn"]').click()
  cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 0')
  cy.get('[data-cy="waitlistTab"]').should('not.exist')
  cy.get('[data-cy="eventTitle"]').type('Cypress Test Event Title')
  cy.get('[data-cy="eventDescription"]').type('Cypress Test Event Description')
  cy.get('#mat-mdc-slide-toggle-1-button').click()
  cy.get('[data-cy="maxAttendeesField"]').click()
  cy.get('[data-cy="maxAttendees"]').type('5')
  cy.get('[data-cy="attendeesTabTitle"]').contains('/5')
  // team allocations
  cy.get('[data-cy="teamColorMenuBtn"]').should('not.exist')
  cy.get('#mat-mdc-slide-toggle-2-button').click()
  cy.get('[data-cy="teamColorMenuBtn"]').click()
  cy.get('[data-cy="teamColorSelectBtn"]:first').click()
  cy.get('[data-cy="addTeamBtn"]').click()
  cy.get('[data-cy="teamColorSelectBtn"]:last').click()

  // join event
  cy.get('[data-cy="eventOwnerJoinBtn"]').contains('JOIN').click()
  cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 1/5')
  cy.get('.mat-mdc-list-item').contains('First Tester')
  cy.get('.mat-chip').should('not.exist')
  cy.get('[data-cy="teamPickBtn"]').click()
  cy.get('[data-cy="setTeamColorBtn"]:first').click()
  //ToDo make it work
  //cy.get('.mat-mdc-chip').contains('Red').should('exist')

  // manually add attendee
  cy.get('[data-cy="eventMenuActionBtn"]').click()
  cy.get('[data-cy="addParticipantBtn"]').click()
  cy.get('[data-cy="saveBtn"]').should('be.disabled')
  cy.get('[data-cy="deleteBtn"]').should('be.disabled')
  cy.get('[data-cy="name"]').type('Added Participant')
  cy.get('[data-cy="saveBtn"]').should('be.enabled').click()
  cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 2/5')
  var manualAttendeeListItem = cy.contains('Added Participant')
  manualAttendeeListItem.click()
  cy.get('[data-cy="closeBtn"]').should('be.enabled').click()
  cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 2/5')
  manualAttendeeListItem.click()
  cy.get('[data-cy="deleteBtn"]').should('be.enabled').click()
  cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 1/5')

  // send message
  cy.get('[data-cy="messagesTabTitle"]').click()
  cy.get('[data-cy="messageInput"]').type('First test message')
  cy.get('[data-cy="sendMessageBtn"]').click()
  cy.get('p').contains('First test message')
  // go back to home page and re-open event
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
  // invite second user
  cy.get('[data-cy="eventInviteBtn"]').click()

  cy.task('checkpoint', 'first user created new event')
  cy.task('waitForCheckpoint', 'second user has joined')
  cy.get('[data-cy="messagesTabTitle"]').should('have.class', 'mat-badge-hidden')
  cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 2/5').click()
  cy.get('.mat-mdc-list-item').contains('Second Tester')
  cy.get('.mat-mdc-chip').contains('PapayaWhip').should('exist')

  // limit attendees to 1
  cy.get('[data-cy="maxAttendees"]').clear()
  cy.get('[data-cy="maxAttendeesField"]').click()
  cy.get('[data-cy="maxAttendees"]').type('1')
  cy.get('[data-cy="messagesTabTitle"]').click()
  cy.get('[data-cy="messageInput"]').type('attendees limited to 1 message')
  cy.get('[data-cy="attendeesTabTitle"]').click()
  cy.task('checkpoint', 'attendees limited to 1')

  cy.task('waitForCheckpoint', 'second user has joined waitlist')
  cy.get('[data-cy="messagesTabTitle"]').should('not.have.class', 'mat-badge-hidden')
  cy.get('[data-cy="waitlistTabTitle"]').contains('Waitlist 1').click()
  cy.get('.mat-mdc-list-item').contains('Second Tester')
  // leave event
  cy.get('[data-cy="notGoingBtn"]').contains('Not Going').click()
  cy.get('[data-cy="waitlistTabTitle"]').should('not.exist')
  cy.get('[data-cy="attendeesTabTitle"]').click()
  cy.get('.mat-mdc-list-item').contains('Second Tester')
  cy.task('checkpoint', 'first user left event')

  cy.task('waitForCheckpoint', 'second user left')
  // read-only mode
  cy.get('[data-cy="readOnlyModeBtn"]').click()
  cy.get('[data-cy="eventTitle"]').should('not.exist')
  cy.get('[data-cy="eventDescription"]').should('not.exist')
  cy.get('[data-cy="eventDescriptionText"]').contains('Cypress Test Event Description')
  // back to edit mode
  cy.get('[data-cy="readOnlyModeBtn"]').click()
  cy.get('[data-cy="eventTitle"]').should('exist')
  cy.get('[data-cy="eventDescription"]').should('exist')
  cy.get('[data-cy="eventDescriptionText"]').should('not.exist')
  // delete event
  cy.get('[data-cy="eventMenuActionBtn"]').click()
  cy.get('[data-cy="deleteEventBtn"]').click()
  cy.get('[data-cy="createNewEventBtn"]').should('exist')
})
