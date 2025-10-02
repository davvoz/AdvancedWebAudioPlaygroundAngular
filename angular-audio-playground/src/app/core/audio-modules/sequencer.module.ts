import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig } from '../../shared/models/module.model';
import { TransportEvent } from './transport.module';

export interface SequencerStep {
  on: boolean;
  midi: number;
  velocity?: number;
}

export class SequencerModule extends BaseAudioModule {
  private pitchSource!: ConstantSourceNode;
  private gateSource!: ConstantSourceNode;

  private steps: SequencerStep[] = [];
  private currentStep = 0;
  private transportRef: any = null;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'Sequencer';
  }

  buildAudio(): void {
    this.pitchSource = this.audioCtx.createConstantSource();
    this.gateSource = this.audioCtx.createConstantSource();

    this.pitchSource.offset.value = 440;
    this.gateSource.offset.value = 0;

    try {
      this.pitchSource.start();
      this.gateSource.start();
    } catch (e) {
      console.warn('Sequencer sources already started');
    }

    // Initialize pattern
    const numSteps = this.state.steps || 8;
    this.steps = this.state.pattern || Array.from({ length: numSteps }, (_, i) => ({
      on: i % 2 === 0,
      midi: 48 + (i % 12),
      velocity: 1.0
    }));

    // Define ports
    const dummyClock = this.audioCtx.createGain();
    const dummyBpm = this.audioCtx.createGain();
    this.inputs.set('clock', { name: 'clock', param: dummyClock.gain });
    this.inputs.set('bpm', { name: 'bpm', param: dummyBpm.gain });
    this.outputs.set('pitch', { name: 'pitch', node: this.pitchSource });
    this.outputs.set('gate', { name: 'gate', node: this.gateSource });
  }

  onClockTick(event: TransportEvent): void {
    if (event.reset) {
      this.currentStep = 0;
      return;
    }

    const step = this.steps[this.currentStep];
    if (step && step.on) {
      const freq = this.midiToFreq(step.midi);
      const velocity = step.velocity || 1.0;

      this.pitchSource.offset.setValueAtTime(freq, event.time);
      this.gateSource.offset.setValueAtTime(velocity, event.time);

      // Gate off after duration
      const gateLength = this.state.gateLen || 0.5;
      const secondsPerBeat = 60.0 / event.bpm;
      const noteDuration = (secondsPerBeat / event.ppqn) * gateLength;
      this.gateSource.offset.setValueAtTime(0, event.time + noteDuration);
    } else {
      this.gateSource.offset.setValueAtTime(0, event.time);
    }

    this.currentStep = (this.currentStep + 1) % this.steps.length;
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  setPattern(pattern: SequencerStep[]): void {
    this.steps = pattern;
    this.state.pattern = pattern;
  }

  setStep(index: number, step: SequencerStep): void {
    if (index >= 0 && index < this.steps.length) {
      this.steps[index] = step;
      this.state.pattern = this.steps;
    }
  }

  getPattern(): SequencerStep[] {
    return [...this.steps];
  }

  protected override applyState(): void {
    if (this.state.pattern) {
      this.steps = this.state.pattern;
    }
  }

  override dispose(): void {
    try {
      this.pitchSource.stop();
      this.gateSource.stop();
    } catch (e) {
      // Already stopped
    }
    super.dispose();
  }
}
