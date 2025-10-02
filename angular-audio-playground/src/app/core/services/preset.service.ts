import { Injectable } from '@angular/core';
import { PresetData } from '../../shared/models/module.model';

@Injectable({
  providedIn: 'root'
})
export class PresetService {
  private presets: Map<string, PresetData> = new Map();

  constructor() {
    this.initializeBuiltinPresets();
  }

  private initializeBuiltinPresets(): void {
    // Simple Bass
    this.presets.set('Simple Bass', {
      modules: [
        { id: 'osc-1', type: 'Oscillator', position: { x: 100, y: 100 }, state: { type: 'sawtooth', freq: 55, level: 0.3 } },
        { id: 'filter-1', type: 'Filter', position: { x: 400, y: 100 }, state: { type: 'lowpass', cutoff: 600, q: 5 } },
        { id: 'gain-1', type: 'Gain', position: { x: 700, y: 100 }, state: { gain: 0.8 } },
        { id: 'dest-1', type: 'Destination', position: { x: 1000, y: 100 }, state: { level: 0.9 } }
      ],
      connections: [
        { id: 'c1', fromModuleId: 'osc-1', fromPortName: 'out', toModuleId: 'filter-1', toPortName: 'in' },
        { id: 'c2', fromModuleId: 'filter-1', fromPortName: 'out', toModuleId: 'gain-1', toPortName: 'in' },
        { id: 'c3', fromModuleId: 'gain-1', fromPortName: 'out', toModuleId: 'dest-1', toPortName: 'in' }
      ]
    });

    // Echo Space
    this.presets.set('Echo Space', {
      modules: [
        { id: 'osc-1', type: 'Oscillator', position: { x: 100, y: 100 }, state: { type: 'sine', freq: 440, level: 0.2 } },
        { id: 'delay-1', type: 'Delay', position: { x: 400, y: 100 }, state: { time: 0.5, feedback: 0.5, mix: 0.6 } },
        { id: 'reverb-1', type: 'Reverb', position: { x: 700, y: 100 }, state: { mix: 0.4, duration: 2, decay: 2 } },
        { id: 'dest-1', type: 'Destination', position: { x: 1000, y: 100 }, state: { level: 0.9 } }
      ],
      connections: [
        { id: 'c1', fromModuleId: 'osc-1', fromPortName: 'out', toModuleId: 'delay-1', toPortName: 'in' },
        { id: 'c2', fromModuleId: 'delay-1', fromPortName: 'out', toModuleId: 'reverb-1', toPortName: 'in' },
        { id: 'c3', fromModuleId: 'reverb-1', fromPortName: 'out', toModuleId: 'dest-1', toPortName: 'in' }
      ]
    });

    // Tremolo
    this.presets.set('Tremolo', {
      modules: [
        { id: 'osc-1', type: 'Oscillator', position: { x: 100, y: 100 }, state: { type: 'sawtooth', freq: 220, level: 0.3 } },
        { id: 'lfo-1', type: 'LFO', position: { x: 100, y: 300 }, state: { type: 'sine', rate: 5, depth: 0.5 } },
        { id: 'gain-1', type: 'Gain', position: { x: 400, y: 100 }, state: { gain: 0.5 } },
        { id: 'dest-1', type: 'Destination', position: { x: 700, y: 100 }, state: { level: 0.9 } }
      ],
      connections: [
        { id: 'c1', fromModuleId: 'osc-1', fromPortName: 'out', toModuleId: 'gain-1', toPortName: 'in' },
        { id: 'c2', fromModuleId: 'lfo-1', fromPortName: 'out', toModuleId: 'gain-1', toPortName: 'gain' },
        { id: 'c3', fromModuleId: 'gain-1', fromPortName: 'out', toModuleId: 'dest-1', toPortName: 'in' }
      ]
    });

    // Vibrato Pad
    this.presets.set('Vibrato Pad', {
      modules: [
        { id: 'osc-1', type: 'Oscillator', position: { x: 100, y: 100 }, state: { type: 'sine', freq: 440, level: 0.2 } },
        { id: 'lfo-1', type: 'LFO', position: { x: 100, y: 300 }, state: { type: 'sine', rate: 6, depth: 20 } },
        { id: 'dest-1', type: 'Destination', position: { x: 400, y: 100 }, state: { level: 0.9 } }
      ],
      connections: [
        { id: 'c1', fromModuleId: 'lfo-1', fromPortName: 'out', toModuleId: 'osc-1', toPortName: 'freq' },
        { id: 'c2', fromModuleId: 'osc-1', fromPortName: 'out', toModuleId: 'dest-1', toPortName: 'in' }
      ]
    });
  }

  getPresetNames(): string[] {
    return Array.from(this.presets.keys());
  }

  getPreset(name: string): PresetData | undefined {
    return this.presets.get(name);
  }

  savePreset(name: string, data: PresetData): void {
    this.presets.set(name, data);
  }

  deletePreset(name: string): void {
    this.presets.delete(name);
  }

  exportPreset(data: PresetData): string {
    return JSON.stringify(data, null, 2);
  }

  importPreset(json: string): PresetData {
    return JSON.parse(json);
  }
}
