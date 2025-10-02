import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig } from '../../shared/models/module.model';

export class ADSRModule extends BaseAudioModule {
  private envelopeSource!: ConstantSourceNode;
  private envelopeGain!: GainNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'ADSR';
  }

  buildAudio(): void {
    this.envelopeSource = this.audioCtx.createConstantSource();
    this.envelopeGain = this.audioCtx.createGain();

    this.envelopeSource.offset.value = 1.0;
    this.envelopeGain.gain.value = 0;

    this.envelopeSource.connect(this.envelopeGain);

    // Start the constant source
    try {
      this.envelopeSource.start();
    } catch (e) {
      console.warn('ADSR source already started');
    }

    // Define ports
    const dummyGate = this.audioCtx.createGain();
    this.inputs.set('gate', { name: 'gate', param: dummyGate.gain });
    this.outputs.set('out', { name: 'out', node: this.envelopeGain });

    // Default ADSR values
    if (!this.state.attack) this.state.attack = 0.01;
    if (!this.state.decay) this.state.decay = 0.1;
    if (!this.state.sustain) this.state.sustain = 0.7;
    if (!this.state.release) this.state.release = 0.3;
  }

  trigger(velocity: number = 1.0): void {
    const now = this.audioCtx.currentTime;
    const gain = this.envelopeGain.gain;

    // Cancel any scheduled values
    gain.cancelScheduledValues(now);

    // Attack
    gain.setValueAtTime(0, now);
    gain.linearRampToValueAtTime(velocity, now + this.state.attack);

    // Decay to sustain
    gain.linearRampToValueAtTime(
      velocity * this.state.sustain,
      now + this.state.attack + this.state.decay
    );
  }

  release(): void {
    const now = this.audioCtx.currentTime;
    const gain = this.envelopeGain.gain;

    // Get current value and ramp down to 0
    const currentValue = gain.value;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(currentValue, now);
    gain.linearRampToValueAtTime(0, now + this.state.release);
  }

  protected override applyState(): void {
    // State is applied when trigger() is called
  }

  setAttack(attack: number): void {
    this.state.attack = attack;
  }

  setDecay(decay: number): void {
    this.state.decay = decay;
  }

  setSustain(sustain: number): void {
    this.state.sustain = sustain;
  }

  setRelease(release: number): void {
    this.state.release = release;
  }

  override dispose(): void {
    try {
      this.envelopeSource.stop();
    } catch (e) {
      // Already stopped
    }
    super.dispose();
  }
}
