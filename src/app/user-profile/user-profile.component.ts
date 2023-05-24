import { Component, OnInit, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { DocumentData, DocumentReference, Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadString, getDownloadURL } from '@angular/fire/storage';

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
      await getDownloadURL(ref(this.storage, `profile-images/${this.user?.uid}-240`)) : this.user.photoURL;
    this.isLoading = false;
  }

  updateUser(partialUser: any) {
    if (this.userRef) {
      updateDoc(this.userRef, partialUser);
    }
  }

  async onImageSelected(event: Event) {
    this.isImageLoading = true;
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;
    const file = files[0];

    //Extension is not used because it's not stored in the database for image retrieval.
    //const extension = file.name.split('.')[1];
    const img = new Image();
    img.onload = () => {
      var imageSize = 240;
      const img240 = this.getResizedImageDataUrl(img, file.type, imageSize);
      if (img240) {
        uploadString(ref(this.storage, `profile-images/${this.user?.uid}-${imageSize}`), img240, 'data_url')
          .then(async () => {
            this.updateUser({ isProfileImageInStorage: true });
            this.profileImageUrl = await getDownloadURL(ref(this.storage, `profile-images/${this.user?.uid}-240`));
            this.isImageLoading = false;
          })
          .catch((error) => {
            console.error(error);
            this.isImageLoading = false;
          });
      } else {
        this.isImageLoading = false;
      }
      imageSize = 50;
      const img50 = this.getResizedImageDataUrl(img, file.type, imageSize);
      if (img50) {
        uploadString(ref(this.storage, `profile-images/${this.user?.uid}-${imageSize}`), img50, 'data_url')
          .catch((error) => {
            console.error(error);
          });
      };
    }

    const dataUrl = await this.readFile(file);
    uploadString(ref(this.storage, `profile-images/${this.user?.uid}`), dataUrl, 'data_url');

    img.src = dataUrl;
  }

  readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  }

  getResizedImageDataUrl(img: HTMLImageElement, fileType: string, maxSize: number) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    var width = img.width;
    var height = img.height;
    if (width > height) {
      if (width > maxSize) {
        height = height * (maxSize / width);
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = width * (maxSize / height);
        height = maxSize;
      }
    }
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const resizedDataUrl = canvas.toDataURL(fileType);
    return resizedDataUrl;
  }

  async openFullSizeImage() {
    const fullSizeImageUrl = this.user.isProfileImageInStorage ?
      await getDownloadURL(ref(this.storage, `profile-images/${this.user?.uid}`)) : this.user.photoURL;
    window.open(fullSizeImageUrl);
  }
}
