import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseAudioModule } from '../../../core/audio-modules/base-audio-module';
import { Position, ModuleControl } from '../../../shared/models/module.model';

@Component({
  selector: 'app-audio-module',
  imports: [CommonModule, FormsModule],
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

  getControls(): ModuleControl[] {
    return this.module.getControls();
  }

  trackByControlId(index: number, control: ModuleControl): string {
    return control.id;
  }

  // Converti valore da scala lineare a logaritmica
  toLogScale(value: number, min: number, max: number): number {
    if (min <= 0) min = 0.001; // Evita log(0)
    const minLog = Math.log(min);
    const maxLog = Math.log(max);
    const scale = (maxLog - minLog) / 100; // 0-100 range per lo slider
    return Math.exp(minLog + scale * value);
  }

  // Converti valore da scala logaritmica a lineare
  fromLogScale(value: number, min: number, max: number): number {
    if (min <= 0) min = 0.001;
    if (value <= 0) value = min;
    const minLog = Math.log(min);
    const maxLog = Math.log(max);
    const scale = (maxLog - minLog) / 100;
    return (Math.log(value) - minLog) / scale;
  }

  // Ottieni il valore per lo slider (potrebbe essere logaritmico)
  getSliderValue(control: ModuleControl): number {
    if (control.logarithmic && control.min !== undefined && control.max !== undefined) {
      return this.fromLogScale(control.value, control.min, control.max);
    }
    return control.value;
  }

  // Gestisci il cambio dello slider (potrebbe essere logaritmico)
  onSliderChange(control: ModuleControl, sliderValue: number): void {
    console.log('🎚️ Slider change - Control:', control.id, 'Slider value:', sliderValue);
    console.log('🎚️ Is logarithmic?', control.logarithmic);
    console.log('🎚️ Min:', control.min, 'Max:', control.max);
    
    let actualValue = sliderValue;
    
    if (control.logarithmic && control.min !== undefined && control.max !== undefined) {
      actualValue = this.toLogScale(sliderValue, control.min, control.max);
      console.log('🎚️ Converted to log scale:', actualValue);
    }
    
    this.onControlChange(control, actualValue);
  }

  onControlChange(control: ModuleControl, value: any): void {
    console.log('🎛️ Control change:', control.id, 'value:', value);
    
    // Parse value based on control type
    let parsedValue = value;
    if (control.type === 'range' || control.type === 'number') {
      parsedValue = parseFloat(value);
    } else if (control.type === 'checkbox') {
      parsedValue = value === true || value === 'true';
    }
    
    console.log('📊 Parsed value:', parsedValue);
    
    // Update control value for UI sync
    control.value = parsedValue;
    
    // Update module state - this will trigger applyState()
    this.module.onControlChange(control.id, parsedValue);
    
    console.log('✅ Module state updated:', this.module.getState());
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
