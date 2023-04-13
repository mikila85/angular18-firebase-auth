import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { CanActivateGuard } from './can-activate.guard';
import { EventComponent } from './event/event.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { StripeAccountCreatedComponent } from './stripe-account-created/stripe-account-created.component';
import { StripeCheckoutCompletedComponent } from './stripe-checkout-completed/stripe-checkout-completed.component';
import { UserProfileViewComponent } from './user-profile-view/user-profile-view.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'about', component: AboutComponent },
  { path: 'profile', component: UserProfileComponent, canActivate: [CanActivateGuard] },
  { path: 'profile/:userId', component: UserProfileViewComponent, canActivate: [CanActivateGuard] },
  { path: 'event/:eventId', component: EventComponent, canActivate: [CanActivateGuard] },
  { path: 'event', component: EventComponent, canActivate: [CanActivateGuard] },
  { path: 'stripe/:eventId/:accountId', component: StripeAccountCreatedComponent, canActivate: [CanActivateGuard] },
  { path: 'stripe-payment/:eventId/:userId/:success', component: StripeCheckoutCompletedComponent, canActivate: [CanActivateGuard] },
  { path: '', component: HomeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
