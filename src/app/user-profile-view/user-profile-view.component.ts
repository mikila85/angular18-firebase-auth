import { Component, inject, OnInit } from '@angular/core';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { Storage, ref, getDownloadURL } from '@angular/fire/storage';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-profile-view',
  templateUrl: './user-profile-view.component.html',
  styleUrls: ['./user-profile-view.component.css']
})
export class UserProfileViewComponent implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private storage: Storage = inject(Storage);
  user: any;
  profileImageUrl: string | undefined = undefined;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
  ) { }

  async ngOnInit(): Promise<void> {
    const userId = this.route.snapshot.paramMap.get('userId');
    const docRef = doc(this.firestore, `users/${userId}`);
    this.user = (await getDoc(docRef)).data();
    this.profileImageUrl = this.user.isProfileImageInStorage ?
      await getDownloadURL(ref(this.storage, `profile-images/${this.user?.uid}-240`)) : this.user.photoURL;
    this.isLoading = false;
  }
}
