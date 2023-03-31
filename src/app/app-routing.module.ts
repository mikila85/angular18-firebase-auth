import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CanActivateGuard } from './can-activate.guard';
import { EventComponent } from './event/event.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { StripeAccountCreatedComponent } from './stripe-account-created/stripe-account-created.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'event/:eventId', component: EventComponent, canActivate: [CanActivateGuard] },
  { path: 'event', component: EventComponent, canActivate: [CanActivateGuard] },
  { path: 'stripe/:eventId/:accountId', component: StripeAccountCreatedComponent, canActivate: [CanActivateGuard] },

  { path: '', component: HomeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
