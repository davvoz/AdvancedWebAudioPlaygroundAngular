import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig, ModuleControl } from '../../shared/models/module.model';

export class LFOModule extends BaseAudioModule {
  private lfoOscillator!: OscillatorNode;
  private lfoGain!: GainNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'LFO';
  }

  override getControls(): ModuleControl[] {
    return [
      {
        id: 'type',
        label: 'Waveform',
        type: 'select',
        value: this.state.type || 'sine',
        options: [
          { value: 'sine', label: 'Sine' },
          { value: 'square', label: 'Square' },
          { value: 'sawtooth', label: 'Sawtooth' },
          { value: 'triangle', label: 'Triangle' }
        ]
      },
      {
        id: 'rate',
        label: 'Rate',
        type: 'range',
        min: 0.01,
        max: 20,
        step: 0.01,
        value: this.state.rate || 2,
        unit: 'Hz'
      },
      {
        id: 'depth',
        label: 'Depth',
        type: 'range',
        min: 0,
        max: 1000,
        step: 1,
        value: this.state.depth || 100
      }
    ];
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
