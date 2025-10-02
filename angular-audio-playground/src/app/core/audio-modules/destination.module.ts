import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig } from '../../shared/models/module.model';

export class DestinationModule extends BaseAudioModule {
  private gainNode!: GainNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'Destination';
  }

  buildAudio(): void {
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = this.state.level || 0.8;

    // Connect to speakers
    this.gainNode.connect(this.audioCtx.destination);

    // Define ports
    this.inputs.set('in', { name: 'in', node: this.gainNode });
  }

  protected override applyState(): void {
    if (this.gainNode && this.state.level !== undefined) {
      this.gainNode.gain.setTargetAtTime(
        this.state.level,
        this.audioCtx.currentTime,
        0.01
      );
    }
  }

  setLevel(level: number): void {
    this.state.level = level;
    this.gainNode.gain.setTargetAtTime(level, this.audioCtx.currentTime, 0.01);
  }
}
