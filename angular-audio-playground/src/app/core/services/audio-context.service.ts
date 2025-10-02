import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioContextService {
  private audioCtx: AudioContext | null = null;
  public audioState = signal<AudioContextState>('suspended');
  
  getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.audioState.set(this.audioCtx.state);
    }
    return this.audioCtx;
  }

  async toggleAudio(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    } else if (ctx.state === 'running') {
      await ctx.suspend();
    } else if (ctx.state === 'closed') {
      this.audioCtx = null;
      this.getContext();
    }
    this.audioState.set(this.getContext().state);
  }

  async start(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
      this.audioState.set(ctx.state);
    }
  }

  async stop(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'running') {
      await ctx.suspend();
      this.audioState.set(ctx.state);
    }
  }

  isRunning(): boolean {
    return this.audioCtx?.state === 'running';
  }
}
