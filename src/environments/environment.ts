// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  useEmulators: true,
  firebase: {
    projectId: 'team-bldr',
    appId: '1:814914099009:web:204eba22ab3db03a61f3c0',
    databaseURL: 'https://team-bldr.firebaseio.com',
    storageBucket: 'team-bldr.appspot.com',
    locationId: 'us-central',
    apiKey: 'AIzaSyAdF7OKdO0DENlyuzg34c7elxuDaW9IXlg',
    authDomain: 'team-bldr.firebaseapp.com',
    messagingSenderId: '814914099009',
    measurementId: 'G-7H6BET0QG5',
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
