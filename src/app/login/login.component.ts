import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

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
