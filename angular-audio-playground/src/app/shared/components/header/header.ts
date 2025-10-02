import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioContextService } from '../../../core/services/audio-context.service';
import { PresetService } from '../../../core/services/preset.service';
import { WorkspaceService } from '../../../core/services/workspace.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  private audioCtxService = inject(AudioContextService);
  private presetService = inject(PresetService);
  private workspaceService = inject(WorkspaceService);

  audioState = this.audioCtxService.audioState;
  presetNames = this.presetService.getPresetNames();
  selectedPreset = '';

  async toggleAudio(): Promise<void> {
    await this.audioCtxService.toggleAudio();
  }

  loadPreset(): void {
    if (!this.selectedPreset) return;
    
    const preset = this.presetService.getPreset(this.selectedPreset);
    if (preset) {
      this.workspaceService.importState(preset);
    }
  }

  newPreset(): void {
    this.workspaceService.clear();
    this.selectedPreset = '';
  }

  exportPreset(): void {
    const state = this.workspaceService.exportState();
    const json = this.presetService.exportPreset(state);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'preset.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  importPreset(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const preset = this.presetService.importPreset(json);
        this.workspaceService.importState(preset);
      } catch (error) {
        console.error('Error importing preset:', error);
        alert('Error importing preset');
      }
    };
    reader.readAsText(file);
  }
}
