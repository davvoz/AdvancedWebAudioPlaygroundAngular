import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig, ModuleControl } from '../../shared/models/module.model';

export class GainModule extends BaseAudioModule {
  private gainNode!: GainNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
    
    // Check if gainNode was initialized properly
    console.log('🎛️ [Gain] After super(), gainNode exists?', !!this.gainNode);
    
    if (!this.gainNode) {
      console.log('⚠️ [Gain] GainNode was null after super(), rebuilding...');
      this.buildAudio();
      console.log('🎛️ [Gain] After rebuild, gainNode exists?', !!this.gainNode);
    }
  }

  getTitle(): string {
    return 'Gain';
  }

  override getControls(): ModuleControl[] {
    return [
      {
        id: 'gain',
        label: 'Gain',
        type: 'range',
        min: 0,
        max: 2,
        step: 0.01,
        value: this.state.gain || 1.0
      }
    ];
  }

  buildAudio(): void {
    this.gainNode = this.audioCtx.createGain();

    // Default value
    this.gainNode.gain.value = this.state.gain || 1.0;

    console.log('🎛️ [Gain] Built with initial gain:', this.gainNode.gain.value);

    // Define ports
    this.inputs.set('in', { name: 'in', node: this.gainNode });
    this.inputs.set('gain', { name: 'gain', param: this.gainNode.gain });
    this.outputs.set('out', { name: 'out', node: this.gainNode });
  }

  override onControlChange(controlId: string, value: any): void {
    console.log('🎛️ [Gain] onControlChange called:', controlId, '=', value);
    
    // Update state
    this.state[controlId] = value;
    
    // Apply immediately to the gain node
    if (!this.gainNode) {
      console.error('🎛️ [Gain] GainNode not initialized!');
      return;
    }

    if (controlId === 'gain') {
      console.log('🎛️ [Gain] Changing gain from', this.gainNode.gain.value, 'to', value);
      this.gainNode.gain.setTargetAtTime(value, this.audioCtx.currentTime, 0.01);
      console.log('🎛️ [Gain] Gain value:', this.gainNode.gain.value);
    }
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
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(gain, this.audioCtx.currentTime, 0.01);
    }
  }
}
