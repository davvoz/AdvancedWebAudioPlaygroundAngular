import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig } from '../../shared/models/module.model';

export class LFOModule extends BaseAudioModule {
  private lfoOscillator!: OscillatorNode;
  private lfoGain!: GainNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'LFO';
  }

  buildAudio(): void {
    this.lfoOscillator = this.audioCtx.createOscillator();
    this.lfoGain = this.audioCtx.createGain();

    // Default values
    this.lfoOscillator.type = this.state.type || 'sine';
    this.lfoOscillator.frequency.value = this.state.rate || 2;
    this.lfoGain.gain.value = this.state.depth || 100;

    this.lfoOscillator.connect(this.lfoGain);

    // Start LFO
    try {
      this.lfoOscillator.start();
    } catch (e) {
      console.warn('LFO already started');
    }

    // Define ports
    this.inputs.set('rate', { name: 'rate', param: this.lfoOscillator.frequency });
    this.outputs.set('out', { name: 'out', node: this.lfoGain });
  }

  protected override applyState(): void {
    if (this.lfoOscillator) {
      if (this.state.type) {
        this.lfoOscillator.type = this.state.type;
      }
      if (this.state.rate !== undefined) {
        this.lfoOscillator.frequency.setTargetAtTime(
          this.state.rate,
          this.audioCtx.currentTime,
          0.01
        );
      }
    }
    if (this.lfoGain && this.state.depth !== undefined) {
      this.lfoGain.gain.setTargetAtTime(
        this.state.depth,
        this.audioCtx.currentTime,
        0.01
      );
    }
  }

  setRate(rate: number): void {
    this.state.rate = rate;
    this.lfoOscillator.frequency.setTargetAtTime(rate, this.audioCtx.currentTime, 0.01);
  }

  setDepth(depth: number): void {
    this.state.depth = depth;
    this.lfoGain.gain.setTargetAtTime(depth, this.audioCtx.currentTime, 0.01);
  }

  setType(type: OscillatorType): void {
    this.state.type = type;
    this.lfoOscillator.type = type;
  }

  override dispose(): void {
    try {
      this.lfoOscillator.stop();
    } catch (e) {
      // Already stopped
    }
    super.dispose();
  }
}
