import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig } from '../../shared/models/module.model';

export class FMModule extends BaseAudioModule {
  private carrier!: OscillatorNode;
  private modulator!: OscillatorNode;
  private modulatorGain!: GainNode;
  private modulatorFeedback!: GainNode;
  private outputGain!: GainNode;
  private drive!: GainNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'FM Synthesizer';
  }

  buildAudio(): void {
    // Create carrier oscillator
    this.carrier = this.audioCtx.createOscillator();
    this.carrier.type = this.state.carrierType || 'sine';
    this.carrier.frequency.value = this.state.carrierFreq || 220;
    this.carrier.detune.value = this.state.carrierDetune || 0;

    // Create modulator oscillator
    this.modulator = this.audioCtx.createOscillator();
    this.modulator.type = this.state.modulatorType || 'sine';
    this.modulator.frequency.value = this.state.modulatorFreq || 220;
    this.modulator.detune.value = this.state.modulatorDetune || 0;

    // Modulation index (controls frequency deviation in Hz)
    this.modulatorGain = this.audioCtx.createGain();
    this.modulatorGain.gain.value = this.state.index || 0;

    // Modulator feedback
    this.modulatorFeedback = this.audioCtx.createGain();
    this.modulatorFeedback.gain.value = this.state.feedback || 0;

    // Output drive and gain
    this.drive = this.audioCtx.createGain();
    this.drive.gain.value = this.state.drive || 1.0;
    
    this.outputGain = this.audioCtx.createGain();
    this.outputGain.gain.value = this.state.level || 0.3;

    // Routing:
    // Modulator -> ModulatorGain -> Carrier frequency (FM)
    // Modulator -> Feedback -> Modulator frequency (self-modulation)
    // Carrier -> Drive -> Output
    this.modulator.connect(this.modulatorGain);
    this.modulatorGain.connect(this.carrier.frequency);
    
    this.modulator.connect(this.modulatorFeedback);
    this.modulatorFeedback.connect(this.modulator.frequency);
    
    this.carrier.connect(this.drive);
    this.drive.connect(this.outputGain);

    // Start oscillators
    try {
      this.carrier.start();
      this.modulator.start();
    } catch (e) {
      console.warn('FM oscillators already started');
    }

    // Define ports
    this.inputs.set('carrierFreq', { name: 'carrierFreq', param: this.carrier.frequency });
    this.inputs.set('carrierDetune', { name: 'carrierDetune', param: this.carrier.detune });
    this.inputs.set('modulatorFreq', { name: 'modulatorFreq', param: this.modulator.frequency });
    this.inputs.set('modulatorDetune', { name: 'modulatorDetune', param: this.modulator.detune });
    this.inputs.set('index', { name: 'index', param: this.modulatorGain.gain });
    this.inputs.set('feedback', { name: 'feedback', param: this.modulatorFeedback.gain });
    
    this.outputs.set('out', { name: 'out', node: this.outputGain });
  }

  protected override applyState(): void {
    if (this.carrier) {
      if (this.state.carrierType) {
        this.carrier.type = this.state.carrierType;
      }
      if (this.state.carrierFreq !== undefined) {
        this.carrier.frequency.setTargetAtTime(
          this.state.carrierFreq,
          this.audioCtx.currentTime,
          0.01
        );
      }
      if (this.state.carrierDetune !== undefined) {
        this.carrier.detune.setTargetAtTime(
          this.state.carrierDetune,
          this.audioCtx.currentTime,
          0.01
        );
      }
    }

    if (this.modulator) {
      if (this.state.modulatorType) {
        this.modulator.type = this.state.modulatorType;
      }
      if (this.state.modulatorFreq !== undefined) {
        this.modulator.frequency.setTargetAtTime(
          this.state.modulatorFreq,
          this.audioCtx.currentTime,
          0.01
        );
      }
      if (this.state.modulatorDetune !== undefined) {
        this.modulator.detune.setTargetAtTime(
          this.state.modulatorDetune,
          this.audioCtx.currentTime,
          0.01
        );
      }
    }

    if (this.modulatorGain && this.state.index !== undefined) {
      this.modulatorGain.gain.setTargetAtTime(
        this.state.index,
        this.audioCtx.currentTime,
        0.01
      );
    }

    if (this.modulatorFeedback && this.state.feedback !== undefined) {
      this.modulatorFeedback.gain.setTargetAtTime(
        this.state.feedback,
        this.audioCtx.currentTime,
        0.01
      );
    }

    if (this.drive && this.state.drive !== undefined) {
      this.drive.gain.setTargetAtTime(
        this.state.drive,
        this.audioCtx.currentTime,
        0.01
      );
    }

    if (this.outputGain && this.state.level !== undefined) {
      this.outputGain.gain.setTargetAtTime(
        this.state.level,
        this.audioCtx.currentTime,
        0.01
      );
    }
  }

  setCarrierFrequency(freq: number): void {
    this.state.carrierFreq = freq;
    this.carrier.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.01);
  }

  setCarrierType(type: OscillatorType): void {
    this.state.carrierType = type;
    this.carrier.type = type;
  }

  setCarrierDetune(detune: number): void {
    this.state.carrierDetune = detune;
    this.carrier.detune.setTargetAtTime(detune, this.audioCtx.currentTime, 0.01);
  }

  setModulatorFrequency(freq: number): void {
    this.state.modulatorFreq = freq;
    this.modulator.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.01);
  }

  setModulatorType(type: OscillatorType): void {
    this.state.modulatorType = type;
    this.modulator.type = type;
  }

  setModulatorDetune(detune: number): void {
    this.state.modulatorDetune = detune;
    this.modulator.detune.setTargetAtTime(detune, this.audioCtx.currentTime, 0.01);
  }

  setIndex(index: number): void {
    this.state.index = index;
    this.modulatorGain.gain.setTargetAtTime(index, this.audioCtx.currentTime, 0.01);
  }

  setFeedback(feedback: number): void {
    this.state.feedback = feedback;
    this.modulatorFeedback.gain.setTargetAtTime(feedback, this.audioCtx.currentTime, 0.01);
  }

  setDrive(drive: number): void {
    this.state.drive = drive;
    this.drive.gain.setTargetAtTime(drive, this.audioCtx.currentTime, 0.01);
  }

  setLevel(level: number): void {
    this.state.level = level;
    this.outputGain.gain.setTargetAtTime(level, this.audioCtx.currentTime, 0.01);
  }

  override dispose(): void {
    try {
      this.carrier.stop();
      this.modulator.stop();
    } catch (e) {
      // Already stopped
    }
    super.dispose();
  }
}
