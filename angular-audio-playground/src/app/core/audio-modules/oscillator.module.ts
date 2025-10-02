import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig, ModuleControl } from '../../shared/models/module.model';

export class OscillatorModule extends BaseAudioModule {
  private oscillator!: OscillatorNode;
  private gainNode!: GainNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    console.log('🎛️ [Oscillator] Constructor called', config);
    console.log('🎛️ [Oscillator] AudioContext:', audioCtx);
    super(config, audioCtx);
    console.log('🎛️ [Oscillator] After super(), oscillator exists?', !!this.oscillator);
    console.log('🎛️ [Oscillator] After super(), gainNode exists?', !!this.gainNode);
    
    // WORKAROUND: Forziamo la chiamata a buildAudio DOPO il super
    if (!this.oscillator || !this.gainNode) {
      console.warn('⚠️ [Oscillator] Nodes were null after super(), rebuilding...');
      this.buildAudio();
      console.log('🎛️ [Oscillator] After rebuild, oscillator exists?', !!this.oscillator);
      console.log('🎛️ [Oscillator] After rebuild, gainNode exists?', !!this.gainNode);
    }
  }

  getTitle(): string {
    return 'Oscillator';
  }

  override getControls(): ModuleControl[] {
    return [
      {
        id: 'type',
        label: 'Waveform',
        type: 'select',
        value: this.state.type || 'sawtooth',
        options: [
          { value: 'sine', label: 'Sine' },
          { value: 'square', label: 'Square' },
          { value: 'sawtooth', label: 'Sawtooth' },
          { value: 'triangle', label: 'Triangle' }
        ]
      },
      {
        id: 'freq',
        label: 'Frequency',
        type: 'number',
        min: 20,
        max: 2000,
        step: 1,
        value: this.state.freq || 440,
        unit: 'Hz',
        logarithmic: true
      },
      {
        id: 'level',
        label: 'Level',
        type: 'range',
        min: 0,
        max: 1,
        step: 0.01,
        value: this.state.level || 0.3
      }
    ];
  }

  buildAudio(): void {
    console.log('🏗️ [Oscillator] buildAudio() called');
    console.log('🏗️ [Oscillator] audioCtx:', this.audioCtx);
    console.log('🏗️ [Oscillator] audioCtx.state:', this.audioCtx.state);
    
    this.oscillator = this.audioCtx.createOscillator();
    this.gainNode = this.audioCtx.createGain();
    
    console.log('🏗️ [Oscillator] Created oscillator:', this.oscillator);
    console.log('🏗️ [Oscillator] Created gainNode:', this.gainNode);

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
    console.log('🎵 [Oscillator] applyState called with state:', this.state);
    console.log('🎵 [Oscillator] oscillator exists?', !!this.oscillator);
    console.log('🎵 [Oscillator] gainNode exists?', !!this.gainNode);
    
    if (this.oscillator) {
      console.log('🎵 [Oscillator] Oscillator node:', this.oscillator);
      if (this.state.type) {
        console.log('🎵 Setting waveform to:', this.state.type);
        this.oscillator.type = this.state.type;
      }
      if (this.state.freq !== undefined) {
        console.log('🎵 Setting frequency to:', this.state.freq);
        console.log('🎵 Current frequency value:', this.oscillator.frequency.value);
        this.oscillator.frequency.setTargetAtTime(
          this.state.freq,
          this.audioCtx.currentTime,
          0.01
        );
        console.log('🎵 Frequency after setTargetAtTime:', this.oscillator.frequency.value);
      }
    } else {
      console.error('❌ [Oscillator] oscillator node is NULL!');
    }
    
    if (this.gainNode && this.state.level !== undefined) {
      console.log('🎵 Setting level to:', this.state.level);
      this.gainNode.gain.setTargetAtTime(
        this.state.level,
        this.audioCtx.currentTime,
        0.01
      );
    } else if (!this.gainNode) {
      console.error('❌ [Oscillator] gainNode is NULL!');
    }
  }

  setFrequency(freq: number): void {
    this.state.freq = freq;
    if (this.oscillator) {
      this.oscillator.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.01);
    }
  }

  setType(type: OscillatorType): void {
    this.state.type = type;
    if (this.oscillator) {
      this.oscillator.type = type;
    }
  }

  setLevel(level: number): void {
    this.state.level = level;
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(level, this.audioCtx.currentTime, 0.01);
    }
  }

  override dispose(): void {
    try {
      if (this.oscillator) {
        this.oscillator.stop();
      }
    } catch (e) {
      // Already stopped
    }
    super.dispose();
  }
}
