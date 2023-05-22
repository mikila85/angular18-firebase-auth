import { Component, OnInit, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { DocumentData, DocumentReference, Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  private storage: Storage = inject(Storage);
  userRef: DocumentReference<DocumentData> | undefined = undefined;
  user: any;
  profileImageUrl: string | undefined = undefined;
  isLoading: boolean = true;
  isImageLoading: boolean = false;

  async ngOnInit(): Promise<void> {
    const authUser = await this.auth.currentUser;
    this.userRef = doc(this.firestore, `users/${authUser?.uid}`);
    this.user = (await getDoc(this.userRef)).data();
    this.profileImageUrl = this.user.isProfileImageInStorage ?
      await getDownloadURL(ref(this.storage, this.user?.uid)) :
      this.user.photoURL;
    this.isLoading = false;
  }

  updateUser(partialUser: any) {
    if (this.userRef) {
      updateDoc(this.userRef, partialUser);
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    const storageRef = ref(this.storage, this.user?.uid);
    this.isImageLoading = true;
    uploadBytesResumable(storageRef, file).then(async () => {
      this.updateUser({ isProfileImageInStorage: true });
      this.profileImageUrl = await getDownloadURL(storageRef);
      this.isImageLoading = false;
    });
  }
  /* ToDo: Resize image
  const reader = new FileReader();
    reader.onload = (e) => {
    if (!e.target) return;

    var img = new Image();
    img.src = e.target.result as string;
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);

    var MAX_WIDTH = 240;
    var MAX_HEIGHT = 240;
    var width = img.width;
    var height = img.height;

    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
    }
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, width, height);

    dataurl = canvas.toDataURL(file.type);
    document.getElementById('output').src = dataurl;


    this.updateUser({ photoURL: reader.result });
  };
    reader.readAsDataURL(file);
  loadImage
  reader
  */
}
