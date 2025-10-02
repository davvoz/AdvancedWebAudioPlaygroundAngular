import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig } from '../../shared/models/module.model';

export class DelayModule extends BaseAudioModule {
  private delayNode!: DelayNode;
  private feedbackNode!: GainNode;
  private wetNode!: GainNode;
  private dryNode!: GainNode;
  private outputNode!: GainNode;

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'Delay';
  }

  buildAudio(): void {
    this.delayNode = this.audioCtx.createDelay(5.0);
    this.feedbackNode = this.audioCtx.createGain();
    this.wetNode = this.audioCtx.createGain();
    this.dryNode = this.audioCtx.createGain();
    this.outputNode = this.audioCtx.createGain();

    // Default values
    this.delayNode.delayTime.value = this.state.time || 0.5;
    this.feedbackNode.gain.value = this.state.feedback || 0.3;
    this.wetNode.gain.value = this.state.mix || 0.5;
    this.dryNode.gain.value = 1.0 - (this.state.mix || 0.5);

    // Routing: input -> delay -> feedback loop -> wet
    //          input -> dry
    //          wet + dry -> output
    this.delayNode.connect(this.feedbackNode);
    this.feedbackNode.connect(this.delayNode);
    this.delayNode.connect(this.wetNode);
    this.wetNode.connect(this.outputNode);
    this.dryNode.connect(this.outputNode);

    // Define ports
    this.inputs.set('in', { name: 'in', node: this.delayNode });
    this.inputs.set('time', { name: 'time', param: this.delayNode.delayTime });
    this.inputs.set('feedback', { name: 'feedback', param: this.feedbackNode.gain });
    this.outputs.set('out', { name: 'out', node: this.outputNode });
  }

  protected override applyState(): void {
    if (this.delayNode && this.state.time !== undefined) {
      this.delayNode.delayTime.setTargetAtTime(
        this.state.time,
        this.audioCtx.currentTime,
        0.01
      );
    }
    if (this.feedbackNode && this.state.feedback !== undefined) {
      this.feedbackNode.gain.setTargetAtTime(
        this.state.feedback,
        this.audioCtx.currentTime,
        0.01
      );
    }
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
  }

  setDelayTime(time: number): void {
    this.state.time = time;
    this.delayNode.delayTime.setTargetAtTime(time, this.audioCtx.currentTime, 0.01);
  }

  setFeedback(feedback: number): void {
    this.state.feedback = feedback;
    this.feedbackNode.gain.setTargetAtTime(feedback, this.audioCtx.currentTime, 0.01);
  }

  setMix(mix: number): void {
    this.state.mix = mix;
    this.wetNode.gain.setTargetAtTime(mix, this.audioCtx.currentTime, 0.01);
    this.dryNode.gain.setTargetAtTime(1.0 - mix, this.audioCtx.currentTime, 0.01);
  }
}
