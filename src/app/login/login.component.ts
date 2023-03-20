import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthProvider } from 'ngx-auth-firebaseui';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  providers = [AuthProvider.Google, AuthProvider.Facebook, AuthProvider.Microsoft];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  onSuccess(user: any): void {
    this.route.queryParams.subscribe(params => {
      const redirectUrl = params['redirectUrl'];
      if (redirectUrl) {
        this.router.navigate([`${redirectUrl}`]);
      } else {
        this.router.navigate([`/`]);
      }
    });
  }
}
