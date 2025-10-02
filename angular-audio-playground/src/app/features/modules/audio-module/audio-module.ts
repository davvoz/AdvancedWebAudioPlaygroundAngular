import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseAudioModule } from '../../../core/audio-modules/base-audio-module';
import { Position } from '../../../shared/models/module.model';

@Component({
  selector: 'app-audio-module',
  imports: [CommonModule],
  templateUrl: './audio-module.html',
  styleUrl: './audio-module.scss'
})
export class AudioModuleComponent {
  @Input() module!: BaseAudioModule;
  @Input() position!: Position;
  @Output() positionChange = new EventEmitter<{ id: string; position: Position }>();
  @Output() dragStart = new EventEmitter<{ id: string; offsetX: number; offsetY: number }>();
  @Output() dragEnd = new EventEmitter<void>();
  @Output() portClick = new EventEmitter<{ moduleId: string; portName: string; direction: 'input' | 'output' }>();
  @Output() remove = new EventEmitter<void>();

  getInputPorts(): string[] {
    return Array.from(this.module.inputs.keys());
  }

  getOutputPorts(): string[] {
    return Array.from(this.module.outputs.keys());
  }

  onHeaderMouseDown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Calculate offset from module position
    const moduleEl = (event.currentTarget as HTMLElement).closest('.audio-module') as HTMLElement;
    const rect = moduleEl.getBoundingClientRect();
    
    this.dragStart.emit({
      id: this.module.id,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    });
  }

  onPortClick(portName: string, direction: 'input' | 'output'): void {
    this.portClick.emit({ moduleId: this.module.id, portName, direction });
  }

  onRemove(): void {
    this.remove.emit();
  }
}
