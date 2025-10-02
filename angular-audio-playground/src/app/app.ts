import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header';
import { WorkspaceComponent } from './features/workspace/workspace/workspace';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, WorkspaceComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'Advanced Web Audio API Playground';
}
