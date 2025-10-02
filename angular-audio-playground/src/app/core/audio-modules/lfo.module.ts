import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig, ModuleControl } from '../../shared/models/module.model';

export class LFOModule extends BaseAudioModule {
  private lfoOscillator!: OscillatorNode;
  private lfoGain!: GainNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
    
    // Check if nodes were initialized properly
    console.log('🎛️ [LFO] After super(), lfoOscillator exists?', !!this.lfoOscillator);
    console.log('🎛️ [LFO] After super(), lfoGain exists?', !!this.lfoGain);
    
    if (!this.lfoOscillator || !this.lfoGain) {
      console.log('⚠️ [LFO] Nodes were null after super(), rebuilding...');
      this.buildAudio();
      console.log('🎛️ [LFO] After rebuild, lfoOscillator exists?', !!this.lfoOscillator);
      console.log('🎛️ [LFO] After rebuild, lfoGain exists?', !!this.lfoGain);
    }
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

    console.log('🎛️ [LFO] Built with initial state:', {
      type: this.lfoOscillator.type,
      rate: this.lfoOscillator.frequency.value,
      depth: this.lfoGain.gain.value
    });

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

  override onControlChange(controlId: string, value: any): void {
    console.log('🎛️ [LFO] onControlChange called:', controlId, '=', value);
    
    // Update state
    this.state[controlId] = value;
    
    // Apply immediately
    if (!this.lfoOscillator || !this.lfoGain) {
      console.error('🎛️ [LFO] Nodes not initialized!');
      return;
    }

    switch (controlId) {
      case 'type':
        console.log('🎛️ [LFO] Changing type from', this.lfoOscillator.type, 'to', value);
        this.lfoOscillator.type = value as OscillatorType;
        break;
      
      case 'rate':
        console.log('🎛️ [LFO] Changing rate from', this.lfoOscillator.frequency.value, 'to', value);
        this.lfoOscillator.frequency.setTargetAtTime(value, this.audioCtx.currentTime, 0.01);
        break;
      
      case 'depth':
        console.log('🎛️ [LFO] Changing depth from', this.lfoGain.gain.value, 'to', value);
        this.lfoGain.gain.setTargetAtTime(value, this.audioCtx.currentTime, 0.01);
        break;
    }
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
    if (this.lfoOscillator) {
      this.lfoOscillator.frequency.setTargetAtTime(rate, this.audioCtx.currentTime, 0.01);
    }
  }

  setDepth(depth: number): void {
    this.state.depth = depth;
    if (this.lfoGain) {
      this.lfoGain.gain.setTargetAtTime(depth, this.audioCtx.currentTime, 0.01);
    }
  }

  setType(type: OscillatorType): void {
    this.state.type = type;
    if (this.lfoOscillator) {
      this.lfoOscillator.type = type;
    }
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
