import { Component, inject } from '@angular/core';
import { Auth, AuthProvider, FacebookAuthProvider, GoogleAuthProvider, OAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from '@angular/fire/auth';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private auth: Auth = inject(Auth);
  public name: string = '';
  public email: string = '';
  public password: string = '';
  public passwordInputType: string = 'password';
  public isForgotPassword: boolean = false;
  public isSignUp: boolean = false;
  public isNewEmailAccount: boolean = false;

  constructor(
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.iconRegistry
      .addSvgIcon('google', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/mdi/google.svg'))
      .addSvgIcon('facebook', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/mdi/facebook.svg'))
      .addSvgIcon('microsoft', this.sanitizer.bypassSecurityTrustResourceUrl('/assets/mdi/microsoft.svg'));
  }

  loginWithProvider(providerName: 'google' | 'facebook' | 'microsoft'): void {
    var provider: AuthProvider;
    switch (providerName) {
      case 'google': provider = new GoogleAuthProvider(); break;
      case 'facebook': provider = new FacebookAuthProvider(); break;
      case 'microsoft': provider = new OAuthProvider('microsoft.com'); break;
    }
    signInWithPopup(this.auth, provider).then((result) => {
      const user = result.user;
      this.onSuccess(user);
    }).catch((error) => {
      console.log(error);
      //ToDo: Show error message in toast
      console.log(error.message);
    });
  }

  signUpWithPassword() {
    createUserWithEmailAndPassword(this.auth, this.email, this.password).then((userCredential) => {
      const user = userCredential.user;
      this.onSuccess(user);
    }).catch((error) => {
      console.log(error);
      //ToDo: Show error message in toast
      console.log(error.message);
    });
  }

  signInWithPassword() {
    signInWithEmailAndPassword(this.auth, this.email, this.password).then((userCredential) => {
      const user = userCredential.user;
      this.onSuccess(user);
    }).catch((error) => {
      console.log(error);
      //ToDo: Show error message in toast
      console.log(error.message);
    });
  }

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
