import { Component, OnInit, inject } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { DocumentData, DocumentReference, Firestore, deleteDoc, doc, onSnapshot, updateDoc, writeBatch } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Team } from '../models/team.model';
import { TeamUser } from '../models/team-user';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  teamRef: DocumentReference<DocumentData> | undefined;
  user: TeamUser | null = null;
  team: Team | undefined;
  teamId: string | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('teamId');
    if (!this.teamId) {
      console.error('Team ID is falsy');
      return;
    }
    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        console.error('User object is falsy');
        return;
      }
      this.user = Object.assign(user);
      this.teamRef = doc(this.firestore, 'teams', this.teamId as string);
      onSnapshot(this.teamRef, async (teamSnapshot) => {
        if (!teamSnapshot.exists()) {
          console.error('Team does not exist');
          this.snackBar.open('Team was deleted', 'OK', {
            duration: 5000
          });
          deleteDoc(doc(this.firestore, 'users', user.uid, 'teams', this.teamId as string));
          this.router.navigate([`/`]);
        }
        this.team = teamSnapshot.data() as Team;
        this.team.id = teamSnapshot.id;
        this.isLoading = false;
      });
    });
  }

  updateTeam(data: any) {
    updateDoc(this.teamRef as DocumentReference<DocumentData>, data)
  }

  updateTeamTitle(teamTitle: string) {
    const batch = writeBatch(this.firestore);
    batch.update(this.teamRef as DocumentReference<DocumentData>, { title: teamTitle });
    batch.update(doc(this.firestore, 'users', this.user?.uid as string, 'teams', this.teamId as string), { title: teamTitle });
    batch.commit();
  }

}
