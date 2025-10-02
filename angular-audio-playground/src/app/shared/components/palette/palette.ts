import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleType, Position } from '../../../shared/models/module.model';

@Component({
  selector: 'app-palette',
  imports: [CommonModule],
  templateUrl: './palette.html',
  styleUrl: './palette.scss'
})
export class PaletteComponent {
  @Output() moduleCreate = new EventEmitter<{ type: string; position: Position }>();

  moduleTypes: ModuleType[] = [
    'Oscillator',
    'Filter',
    'Gain',
    'Delay',
    'Reverb',
    'Distortion',
    'LFO',
    'ADSR',
    'Transport',
    'Sequencer',
    'Sampler',
    'Destination',
    'FM'
  ];

  onDragStart(event: DragEvent, type: ModuleType): void {
    event.dataTransfer!.effectAllowed = 'copy';
    event.dataTransfer!.setData('text/plain', type);
  }
}
