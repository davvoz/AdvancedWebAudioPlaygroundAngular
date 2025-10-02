import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig } from '../../shared/models/module.model';

export class FilterModule extends BaseAudioModule {
  private filter!: BiquadFilterNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'Filter';
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
