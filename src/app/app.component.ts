import { Component, inject } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private auth: Auth = inject(Auth);
  showSignInButton: boolean = false;
  /* ToDo
  avatarLinks: LinkMenuItem[] = [
    { icon: 'account_circle', text: 'Profile', callback: () => { this.router.navigate(['profile']); } },
    { icon: 'info', text: 'About the app', callback: () => { this.router.navigate(['about']); } },
    {
      icon: 'mail', text: 'Contact the developer', callback: () => {
        window.open('mailto:azhidkov@gmail.com?subject=Team%20Builder%20App&body=Hi%20Alex,%20Love%20your%20app!');
      }
    },
  ];
*/
  constructor(private router: Router) { }

  async ngOnInit(): Promise<void> {
    onAuthStateChanged(this.auth, (user) => {
      this.showSignInButton = Boolean(!user);
    });
  }

  onSignOut(): void {
    this.router.navigate(['/']).then(() => location.reload());
  }
}
