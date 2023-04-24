import { defineConfig } from 'cypress'

// https://glebbahmutov.com/blog/keep-passwords-secret-in-e2e-tests/
export default defineConfig({

  e2e: {
    'baseUrl': 'http://localhost:4200',
    "env": {
      'prodUrl': 'https://team-bldr.web.app',
      'e2e-password': ""
    }
  },


  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.ts'
  }

})