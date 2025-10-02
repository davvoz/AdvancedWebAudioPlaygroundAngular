import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig, ModuleControl } from '../../shared/models/module.model';

export class FilterModule extends BaseAudioModule {
  private filter!: BiquadFilterNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
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
    this.filter.type = this.state.type || 'lowpass';
    this.filter.frequency.value = this.state.cutoff || 1000;
    this.filter.Q.value = this.state.q || 1;

    // Define ports
    this.inputs.set('in', { name: 'in', node: this.filter });
    this.inputs.set('cutoff', { name: 'cutoff', param: this.filter.frequency });
    this.inputs.set('q', { name: 'q', param: this.filter.Q });
    this.outputs.set('out', { name: 'out', node: this.filter });
  }

  protected override applyState(): void {
    if (this.filter) {
      if (this.state.type) {
        this.filter.type = this.state.type;
      }
      if (this.state.cutoff !== undefined) {
        this.filter.frequency.setTargetAtTime(
          this.state.cutoff,
          this.audioCtx.currentTime,
          0.01
        );
      }
      if (this.state.q !== undefined) {
        this.filter.Q.setTargetAtTime(
          this.state.q,
          this.audioCtx.currentTime,
          0.01
        );
      }
    }
  }

  setType(type: BiquadFilterType): void {
    this.state.type = type;
    this.filter.type = type;
  }

  setCutoff(cutoff: number): void {
    this.state.cutoff = cutoff;
    this.filter.frequency.setTargetAtTime(cutoff, this.audioCtx.currentTime, 0.01);
  }

  setQ(q: number): void {
    this.state.q = q;
    this.filter.Q.setTargetAtTime(q, this.audioCtx.currentTime, 0.01);
  }
}
