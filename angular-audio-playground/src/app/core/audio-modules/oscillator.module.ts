import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig } from '../../shared/models/module.model';

export class OscillatorModule extends BaseAudioModule {
  private oscillator!: OscillatorNode;
  private gainNode!: GainNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'Oscillator';
  }

  buildAudio(): void {
    this.oscillator = this.audioCtx.createOscillator();
    this.gainNode = this.audioCtx.createGain();

    // Default values
    this.oscillator.type = this.state.type || 'sawtooth';
    this.oscillator.frequency.value = this.state.freq || 440;
    this.gainNode.gain.value = this.state.level || 0.3;

    this.oscillator.connect(this.gainNode);

    // Start oscillator
    try {
      this.oscillator.start();
    } catch (e) {
      console.warn('Oscillator already started');
    }

    // Define ports
    this.inputs.set('freq', { name: 'freq', param: this.oscillator.frequency });
    this.inputs.set('detune', { name: 'detune', param: this.oscillator.detune });
    this.outputs.set('out', { name: 'out', node: this.gainNode });
  }

  protected override applyState(): void {
    if (this.oscillator) {
      if (this.state.type) {
        this.oscillator.type = this.state.type;
      }
      if (this.state.freq !== undefined) {
        this.oscillator.frequency.setTargetAtTime(
          this.state.freq,
          this.audioCtx.currentTime,
          0.01
        );
      }
    }
    if (this.gainNode && this.state.level !== undefined) {
      this.gainNode.gain.setTargetAtTime(
        this.state.level,
        this.audioCtx.currentTime,
        0.01
      );
    }
  }

  setFrequency(freq: number): void {
    this.state.freq = freq;
    this.oscillator.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.01);
  }

  setType(type: OscillatorType): void {
    this.state.type = type;
    this.oscillator.type = type;
  }

  setLevel(level: number): void {
    this.state.level = level;
    this.gainNode.gain.setTargetAtTime(level, this.audioCtx.currentTime, 0.01);
  }

  override dispose(): void {
    try {
      this.oscillator.stop();
    } catch (e) {
      // Already stopped
    }
    super.dispose();
  }
}
