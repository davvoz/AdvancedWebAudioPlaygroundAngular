import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig } from '../../shared/models/module.model';

export class GainModule extends BaseAudioModule {
  private gainNode!: GainNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'Gain';
  }

  buildAudio(): void {
    this.gainNode = this.audioCtx.createGain();

    // Default value
    this.gainNode.gain.value = this.state.gain || 1.0;

    // Define ports
    this.inputs.set('in', { name: 'in', node: this.gainNode });
    this.inputs.set('gain', { name: 'gain', param: this.gainNode.gain });
    this.outputs.set('out', { name: 'out', node: this.gainNode });
  }

  protected override applyState(): void {
    if (this.gainNode && this.state.gain !== undefined) {
      this.gainNode.gain.setTargetAtTime(
        this.state.gain,
        this.audioCtx.currentTime,
        0.01
      );
    }
  }

  setGain(gain: number): void {
    this.state.gain = gain;
    this.gainNode.gain.setTargetAtTime(gain, this.audioCtx.currentTime, 0.01);
  }
}
