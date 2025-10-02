import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig } from '../../shared/models/module.model';

export class SamplerModule extends BaseAudioModule {
  private outputNode!: GainNode;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private fileName = '';

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'Sampler';
  }

  buildAudio(): void {
    this.outputNode = this.audioCtx.createGain();
    this.outputNode.gain.value = this.state.gain || 1.0;

    // Define ports
    const dummyPitch = this.audioCtx.createGain();
    const dummyGate = this.audioCtx.createGain();
    this.inputs.set('pitch', { name: 'pitch', param: dummyPitch.gain });
    this.inputs.set('gate', { name: 'gate', param: dummyGate.gain });
    this.outputs.set('out', { name: 'out', node: this.outputNode });
  }

  async loadFile(file: File): Promise<void> {
    try {
      this.fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      this.buffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      console.log(`Loaded sample: ${this.fileName}, duration: ${this.buffer.duration}s`);
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw error;
    }
  }

  trigger(pitch: number = 440, startOffset: number = 0): void {
    if (!this.buffer) {
      console.warn('No buffer loaded');
      return;
    }

    // Stop previous source
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        // Already stopped
      }
    }

    // Create new source
    this.source = this.audioCtx.createBufferSource();
    this.source.buffer = this.buffer;
    
    // Calculate playback rate from pitch
    const rootMidi = this.state.rootMidi || 60;
    const rootFreq = 440 * Math.pow(2, (rootMidi - 69) / 12);
    const playbackRate = pitch / rootFreq;
    this.source.playbackRate.value = playbackRate;

    this.source.connect(this.outputNode);

    // Start playback
    const now = this.audioCtx.currentTime;
    this.source.start(now, startOffset);
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        // Already stopped
      }
      this.source = null;
    }
  }

  setGain(gain: number): void {
    this.state.gain = gain;
    this.outputNode.gain.setTargetAtTime(gain, this.audioCtx.currentTime, 0.01);
  }

  setRootMidi(midi: number): void {
    this.state.rootMidi = midi;
  }

  getBuffer(): AudioBuffer | null {
    return this.buffer;
  }

  getFileName(): string {
    return this.fileName;
  }

  protected override applyState(): void {
    if (this.state.gain !== undefined) {
      this.outputNode.gain.setTargetAtTime(
        this.state.gain,
        this.audioCtx.currentTime,
        0.01
      );
    }
  }

  override dispose(): void {
    this.stop();
    super.dispose();
  }
}
