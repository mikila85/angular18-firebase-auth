import { HttpClientModule } from '@angular/common/http';
import { isDevMode, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { connectFunctionsEmulator, getFunctions, provideFunctions } from '@angular/fire/functions';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { AboutComponent } from './about/about.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthFirebaseuiAvatarComponent } from "./auth-firebaseui-avatar/auth-firebaseui-avatar.component";
import { EventParticipantsComponent } from './event-participants/event-participants.component';
import { EventComponent } from './event/event.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { MessagesComponent } from './messages/messages.component';
import { StripeAccountCreatedComponent } from './stripe-account-created/stripe-account-created.component';
import { StripeCheckoutCompletedComponent } from './stripe-checkout-completed/stripe-checkout-completed.component';
import { StripePaymentComponent } from './stripe-payment/stripe-payment.component';
import { UserProfileViewComponent } from './user-profile-view/user-profile-view.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [
    AuthFirebaseuiAvatarComponent,
    AppComponent,
    HomeComponent,
    LoginComponent,
    EventComponent,
    EventParticipantsComponent,
    MessagesComponent,
    StripePaymentComponent,
    StripeAccountCreatedComponent,
    StripeCheckoutCompletedComponent,
    UserProfileComponent,
    AboutComponent,
    UserProfileViewComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    HttpClientModule,
    FormsModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => getAnalytics()),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => {
      const functions = getFunctions(undefined, 'australia-southeast1');
      if (environment.useEmulators) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }
      return functions;
    }),
    provideMessaging(() => getMessaging()),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    ClipboardModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatListModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  providers: [
    ScreenTrackingService, UserTrackingService,
    { provide: MAT_DATE_LOCALE, useValue: 'en-AU' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
