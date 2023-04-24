describe('My First Test', () => {
  it('Visits the Team Builder landing page', () => {
    cy.visit('/')
    cy.get('[data-cy="signInBtn"]').contains('Sign In')
    cy.get('[data-cy="createNewEventBtn"]').contains('Create New Event')
  })

  it('User logs in with email and password', () => {
    cy.visit('/')
    cy.get('[data-cy="signInBtn"]').click()
    cy.get('[data-cy="googleBtn"]').contains('Google')
    cy.get('[data-cy="signInEmail"]').type('teambldrtest+e2e@gmail.com')
    cy.get('[data-cy="signInPassword"]').type('e2e-Y3oWzS6CkVIAErE')
    cy.get('[data-cy="signInLoginBtn"]').click()
  })

  it.only('User creates a new event', () => {
    cy.visit('/')
    cy.get('[data-cy="createNewEventBtn"]').click()
    cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 0')
    cy.get('[data-cy="eventTitle"]').type('Cypress Test Event Title')
    cy.get('[data-cy="eventDescription"]').type('Cypress Test Event Description')
    cy.get('[data-cy="attendeeLimitToggle"]').click()
    cy.get('[data-cy="maxAttendees"]').type('5')
    cy.get('[data-cy="attendeesTabTitle"]').contains('/5')
    cy.get('[data-cy="eventJoinBtn"]').contains('JOIN').click()
    cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 1/5')


    cy.get('[data-cy="eventJoinBtn"]').contains('LEAVE').click()
    cy.get('[data-cy="attendeesTabTitle"]').contains('Attendees 0/5')





    cy.get('[data-cy="eventMenuActionBtn"]').click()
    cy.get('[data-cy="deleteEventBtn"]').click()
    cy.get('[data-cy="createNewEventBtn"]').contains('Create New Event')
  })

})
