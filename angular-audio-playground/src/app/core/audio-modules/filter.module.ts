import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig, ModuleControl } from '../../shared/models/module.model';

export class FilterModule extends BaseAudioModule {
  private filter!: BiquadFilterNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
    
    // Check if filter was initialized properly
    console.log('🎛️ [Filter] After super(), filter exists?', !!this.filter);
    
    if (!this.filter) {
      console.log('⚠️ [Filter] Filter was null after super(), rebuilding...');
      this.buildAudio();
      console.log('🎛️ [Filter] After rebuild, filter exists?', !!this.filter);
    }
  }

  getTitle(): string {
    return 'Filter';
  }

  override getControls(): ModuleControl[] {
    return [
      {
        id: 'type',
        label: 'Type',
        type: 'select',
        value: this.state.type || 'lowpass',
        options: [
          { value: 'lowpass', label: 'Lowpass' },
          { value: 'highpass', label: 'Highpass' },
          { value: 'bandpass', label: 'Bandpass' },
          { value: 'notch', label: 'Notch' },
          { value: 'allpass', label: 'Allpass' },
          { value: 'lowshelf', label: 'Low Shelf' },
          { value: 'highshelf', label: 'High Shelf' },
          { value: 'peaking', label: 'Peaking' }
        ]
      },
      {
        id: 'cutoff',
        label: 'Frequency',
        type: 'number',
        min: 20,
        max: 20000,
        step: 1,
        value: this.state.cutoff || 1000,
        unit: 'Hz',
        logarithmic: true
      },
      {
        id: 'q',
        label: 'Q / Resonance',
        type: 'range',
        min: 0.001,
        max: 30,
        step: 0.1,
        value: this.state.q || 1
      }
    ];
  }

  buildAudio(): void {
    this.filter = this.audioCtx.createBiquadFilter();

    // Default values
    this.filter.type = (this.state.type || 'lowpass') as BiquadFilterType;
    this.filter.frequency.value = this.state.cutoff || 1000;
    this.filter.Q.value = this.state.q || 1;

    console.log('🎛️ [Filter] Built with initial state:', {
      type: this.filter.type,
      frequency: this.filter.frequency.value,
      Q: this.filter.Q.value
    });

    // Define ports
    this.inputs.set('in', { name: 'in', node: this.filter });
    this.inputs.set('cutoff', { name: 'cutoff', param: this.filter.frequency });
    this.inputs.set('q', { name: 'q', param: this.filter.Q });
    this.outputs.set('out', { name: 'out', node: this.filter });
  }

  override onControlChange(controlId: string, value: any): void {
    console.log('🎛️ [Filter] onControlChange called:', controlId, '=', value);
    
    // Update state
    this.state[controlId] = value;
    
    // Apply immediately to the filter node
    if (!this.filter) {
      console.error('🎛️ [Filter] Filter node not initialized!');
      return;
    }

    switch (controlId) {
      case 'type':
        console.log('🎛️ [Filter] Changing type from', this.filter.type, 'to', value);
        this.filter.type = value as BiquadFilterType;
        console.log('🎛️ [Filter] Type is now:', this.filter.type);
        break;
      
      case 'cutoff':
        console.log('🎛️ [Filter] Changing frequency from', this.filter.frequency.value, 'to', value);
        this.filter.frequency.setTargetAtTime(value, this.audioCtx.currentTime, 0.01);
        console.log('🎛️ [Filter] Frequency value:', this.filter.frequency.value);
        break;
      
      case 'q':
        console.log('🎛️ [Filter] Changing Q from', this.filter.Q.value, 'to', value);
        this.filter.Q.setTargetAtTime(value, this.audioCtx.currentTime, 0.01);
        console.log('🎛️ [Filter] Q value:', this.filter.Q.value);
        break;
    }
  }

  protected override applyState(): void {
    if (!this.filter) return;
    
    console.log('🎛️ [Filter] Applying state:', this.state);
    
    if (this.state.type !== undefined) {
      console.log('🎛️ [Filter] Setting type to:', this.state.type);
      this.filter.type = this.state.type as BiquadFilterType;
    }
    
    if (this.state.cutoff !== undefined) {
      console.log('🎛️ [Filter] Setting frequency to:', this.state.cutoff);
      this.filter.frequency.setTargetAtTime(
        this.state.cutoff,
        this.audioCtx.currentTime,
        0.01
      );
    }
    
    if (this.state.q !== undefined) {
      console.log('🎛️ [Filter] Setting Q to:', this.state.q);
      this.filter.Q.setTargetAtTime(
        this.state.q,
        this.audioCtx.currentTime,
        0.01
      );
    }
  }

  setType(type: BiquadFilterType): void {
    this.state.type = type;
    if (this.filter) {
      this.filter.type = type;
    }
  }

  setCutoff(cutoff: number): void {
    this.state.cutoff = cutoff;
    if (this.filter) {
      this.filter.frequency.setTargetAtTime(cutoff, this.audioCtx.currentTime, 0.01);
    }
  }

  setQ(q: number): void {
    this.state.q = q;
    if (this.filter) {
      this.filter.Q.setTargetAtTime(q, this.audioCtx.currentTime, 0.01);
    }
  }
}
