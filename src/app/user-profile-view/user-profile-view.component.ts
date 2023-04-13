import { Component, inject, OnInit } from '@angular/core';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-profile-view',
  templateUrl: './user-profile-view.component.html',
  styleUrls: ['./user-profile-view.component.css']
})
export class UserProfileViewComponent implements OnInit {
  private firestore: Firestore = inject(Firestore);
  user: any;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    const docRef = doc(this.firestore, `users/${userId}`);
    getDoc(docRef).then((user) => {
      this.user = user.data();
      this.isLoading = false;
    });
  }
}
