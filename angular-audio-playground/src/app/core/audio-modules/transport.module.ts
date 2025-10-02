import { BaseAudioModule } from './base-audio-module';
import { ModuleConfig } from '../../shared/models/module.model';

export interface TransportEvent {
  time: number;
  bpm: number;
  ppqn: number;
  tick: number;
  beat: number;
  reset?: boolean;
}

export class TransportModule extends BaseAudioModule {
  private clockSource!: ConstantSourceNode;
  private bpmSource!: ConstantSourceNode;
  private beatSource!: ConstantSourceNode;

  private running = false;
  private bpm = 120;
  private ppqn = 4; // 16th notes per quarter
  private tickIndex = 0;
  private nextTickTime = 0;
  private animationId?: number;
  private subscribers = new Map<string, (event: TransportEvent) => void>();

  constructor(config: ModuleConfig, audioCtx: AudioContext) {
    super(config, audioCtx);
  }

  getTitle(): string {
    return 'Transport';
  }

  buildAudio(): void {
    this.clockSource = this.audioCtx.createConstantSource();
    this.bpmSource = this.audioCtx.createConstantSource();
    this.beatSource = this.audioCtx.createConstantSource();

    this.bpm = this.state.bpm || 120;
    
    this.clockSource.offset.value = 0;
    this.bpmSource.offset.value = this.bpm;
    this.beatSource.offset.value = 0;

    try {
      this.clockSource.start();
      this.bpmSource.start();
      this.beatSource.start();
    } catch (e) {
      console.warn('Transport sources already started');
    }

    // Define ports
    this.outputs.set('clock', { name: 'clock', node: this.clockSource });
    this.outputs.set('bpm', { name: 'bpm', node: this.bpmSource });
    this.outputs.set('beat', { name: 'beat', node: this.beatSource });
  }

  start(): void {
    if (this.running) return;
    
    this.running = true;
    this.nextTickTime = this.audioCtx.currentTime + 0.05;
    this.scheduleTick();
  }

  stop(): void {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
    
    const now = this.audioCtx.currentTime;
    this.clockSource.offset.setTargetAtTime(0, now, 0.01);
    this.beatSource.offset.setTargetAtTime(0, now, 0.01);
  }

  reset(): void {
    const now = this.audioCtx.currentTime;
    this.tickIndex = 0;
    this.nextTickTime = this.running ? now + 0.05 : now;
    
    this.clockSource.offset.setTargetAtTime(0, now, 0.005);
    this.beatSource.offset.setTargetAtTime(0, now, 0.005);

    // Notify subscribers
    const evt: TransportEvent = {
      time: now,
      bpm: this.bpm,
      ppqn: this.ppqn,
      tick: 0,
      beat: 0,
      reset: true
    };
    this.notifySubscribers(evt);
  }

  private scheduleTick(): void {
    if (!this.running) return;

    const now = this.audioCtx.currentTime;
    
    while (this.nextTickTime < now + 0.1) {
      this.triggerTick(this.nextTickTime);
      
      const secondsPerBeat = 60.0 / this.bpm;
      const secondsPerTick = secondsPerBeat / this.ppqn;
      this.nextTickTime += secondsPerTick;
      this.tickIndex++;
    }

    this.animationId = requestAnimationFrame(() => this.scheduleTick());
  }

  private triggerTick(time: number): void {
    const beat = Math.floor(this.tickIndex / this.ppqn);
    
    this.clockSource.offset.setValueAtTime(this.tickIndex, time);
    this.beatSource.offset.setValueAtTime(beat, time);

    const evt: TransportEvent = {
      time,
      bpm: this.bpm,
      ppqn: this.ppqn,
      tick: this.tickIndex,
      beat
    };
    this.notifySubscribers(evt);
  }

  setBpm(bpm: number): void {
    this.bpm = Math.max(20, Math.min(300, bpm));
    this.state.bpm = this.bpm;
    this.bpmSource.offset.setTargetAtTime(this.bpm, this.audioCtx.currentTime, 0.01);
  }

  subscribeClock(id: string, callback: (event: TransportEvent) => void): void {
    this.subscribers.set(id, callback);
  }

  unsubscribeClock(id: string): void {
    this.subscribers.delete(id);
  }

  private notifySubscribers(event: TransportEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (e) {
        console.error('Transport subscriber error:', e);
      }
    });
  }

  isRunning(): boolean {
    return this.running;
  }

  protected override applyState(): void {
    if (this.state.bpm !== undefined) {
      this.setBpm(this.state.bpm);
    }
  }

  override dispose(): void {
    this.stop();
    try {
      this.clockSource.stop();
      this.bpmSource.stop();
      this.beatSource.stop();
    } catch (e) {
      // Already stopped
    }
    super.dispose();
  }
}
