import { Component, OnInit, inject } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { Firestore, collection, doc, onSnapshot, query, writeBatch } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Team } from '../models/team.model';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.css']
})
export class TeamsComponent implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private analytics: Analytics = inject(Analytics);
  isLoading = true;
  private auth: Auth = inject(Auth);
  user: User | null = null;
  teams: Team[] = [];

  constructor(
    private router: Router,
  ) { }

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.user = user;
        const q = collection(this.firestore, `users/${this.user.uid}/teams`);
        onSnapshot(q, (querySnapshot) => {
          this.teams = [];
          querySnapshot.forEach((doc) => {
            var team = doc.data() as Team;
            team.id = doc.id;
            this.teams.push(team);
          });
          this.isLoading = false;
        });
      } else {
        console.error('User object is NULL - user not logged in.');
        this.isLoading = false;
        return;
      }
    });
  }

  createNewTeam(): void {
    if (!this.user) {
      console.error('User object is falsy');
      return;
    }
    const teamId = doc(collection(this.firestore, 'teams')).id;
    logEvent(this.analytics, 'new_team', { uid: this.user.uid, teamId: teamId })
    const batch = writeBatch(this.firestore);
    const newTeam: Team = {
      owner: this.user.uid,
      icon: this.user.photoURL ?? '',
      title: '',
      description: '',
      extras: '',
    }

    batch.set(doc(collection(this.firestore, 'teams'), teamId), newTeam);
    batch.set(doc(collection(this.firestore, 'users', this.user.uid, 'teams'), teamId), {
      title: newTeam.title,
      icon: newTeam.icon,
    });
    batch.commit().then(() => {
      this.router.navigate([`team/${teamId}`]);
    });
  }

}
