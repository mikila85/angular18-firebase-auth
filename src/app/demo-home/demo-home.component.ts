import { Component } from '@angular/core';

@Component({
  selector: 'app-demo-home',
  templateUrl: './demo-home.component.html',
  styleUrls: ['./demo-home.component.css']
})
export class DemoHomeComponent {
  date1: Date;
  date2: Date;
  date3: Date;

  constructor() {
    var now: Date = new Date();
    this.date1 = new Date(now.setDate(now.getDate() + 7 - now.getDay()));
    this.date1.setHours(9);
    this.date1.setMinutes(0);

    now = new Date();
    this.date2 = new Date(now.setDate(now.getDate() + 1));
    this.date2.setHours(19);
    this.date2.setMinutes(0);

    now = new Date();
    this.date3 = new Date(now.setDate(now.getDate() - 2));
    this.date3.setHours(18);
    this.date3.setMinutes(30);
  }

  createNewEvent() { }
}
