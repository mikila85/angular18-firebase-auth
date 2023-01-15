import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { LinkMenuItem } from 'ngx-auth-firebaseui';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  user: firebase.default.User | null = null;
  showSignInButton: boolean = false;
  avatarLinks: LinkMenuItem[] = [
    { icon: 'account_circle', text: 'Profile', callback: () => { this.router.navigate(['profile']); } },
  ];

  constructor(
    private auth: AngularFireAuth,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.auth.user.subscribe(user => {
      this.user = user;
      this.showSignInButton = Boolean(!user);
    });
  }

  onSignOut(): void {
    this.router.navigate(['/']).then(() => location.reload());
  }
}
