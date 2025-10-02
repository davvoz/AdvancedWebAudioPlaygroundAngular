import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig } from '../../shared/models/module.model';

export class ReverbModule extends BaseAudioModule {
  private convolver!: ConvolverNode;
  private wetNode!: GainNode;
  private dryNode!: GainNode;
  private outputNode!: GainNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'Reverb';
  }

  buildAudio(): void {
    this.convolver = this.audioCtx.createConvolver();
    this.wetNode = this.audioCtx.createGain();
    this.dryNode = this.audioCtx.createGain();
    this.outputNode = this.audioCtx.createGain();

    // Default values
    this.wetNode.gain.value = this.state.mix || 0.3;
    this.dryNode.gain.value = 1.0 - (this.state.mix || 0.3);

    // Create impulse response
    this.createImpulseResponse(this.state.duration || 2, this.state.decay || 2);

    // Routing
    this.convolver.connect(this.wetNode);
    this.wetNode.connect(this.outputNode);
    this.dryNode.connect(this.outputNode);

    // Define ports
    this.inputs.set('in', { name: 'in', node: this.convolver });
    this.outputs.set('out', { name: 'out', node: this.outputNode });
  }

  private createImpulseResponse(duration: number, decay: number): void {
    const sampleRate = this.audioCtx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioCtx.createBuffer(2, length, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    }

    this.convolver.buffer = impulse;
  }

  protected override applyState(): void {
    if (this.state.mix !== undefined) {
      this.wetNode.gain.setTargetAtTime(
        this.state.mix,
        this.audioCtx.currentTime,
        0.01
      );
      this.dryNode.gain.setTargetAtTime(
        1.0 - this.state.mix,
        this.audioCtx.currentTime,
        0.01
      );
    }
    if (this.state.duration !== undefined || this.state.decay !== undefined) {
      this.createImpulseResponse(
        this.state.duration || 2,
        this.state.decay || 2
      );
    }
  }

  setMix(mix: number): void {
    this.state.mix = mix;
    this.wetNode.gain.setTargetAtTime(mix, this.audioCtx.currentTime, 0.01);
    this.dryNode.gain.setTargetAtTime(1.0 - mix, this.audioCtx.currentTime, 0.01);
  }

  setDuration(duration: number): void {
    this.state.duration = duration;
    this.createImpulseResponse(duration, this.state.decay || 2);
  }

  setDecay(decay: number): void {
    this.state.decay = decay;
    this.createImpulseResponse(this.state.duration || 2, decay);
  }
}
