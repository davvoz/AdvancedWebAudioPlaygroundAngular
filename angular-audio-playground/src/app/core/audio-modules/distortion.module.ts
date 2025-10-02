import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig, ModuleControl } from '../../shared/models/module.model';

export class DistortionModule extends BaseAudioModule {
  private waveshaper!: WaveShaperNode;
  private preGain!: GainNode;
  private postGain!: GainNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'Distortion';
  }

  override getControls(): ModuleControl[] {
    return [
      {
        id: 'amount',
        label: 'Drive',
        type: 'range',
        min: 0,
        max: 1,
        step: 0.01,
        value: this.state.amount || 0.5
      }
    ];
  }

  buildAudio(): void {
    this.waveshaper = this.audioCtx.createWaveShaper();
    this.preGain = this.audioCtx.createGain();
    this.postGain = this.audioCtx.createGain();

    // Default values
    const amount = this.state.amount || 0.5;
    this.makeDistortionCurve(amount);
    this.preGain.gain.value = 1.0;
    this.postGain.gain.value = 0.5;

    // Routing
    this.preGain.connect(this.waveshaper);
    this.waveshaper.connect(this.postGain);

    // Define ports
    this.inputs.set('in', { name: 'in', node: this.preGain });
    this.outputs.set('out', { name: 'out', node: this.postGain });
  }

  private makeDistortionCurve(amount: number): void {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }

    this.waveshaper.curve = curve;
    this.waveshaper.oversample = '4x';
  }

  protected override applyState(): void {
    if (this.state.amount !== undefined) {
      this.makeDistortionCurve(this.state.amount * 100);
    }
  }

  setAmount(amount: number): void {
    this.state.amount = amount;
    this.makeDistortionCurve(amount * 100);
  }
}
