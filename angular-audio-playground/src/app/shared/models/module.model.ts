export interface Position {
  x: number;
  y: number;
}

export interface Port {
  name: string;
  node?: AudioNode;
  param?: AudioParam;
}

export interface ModuleConfig {
  id: string;
  type: ModuleType;
  position: Position;
  state?: any;
}

export interface Connection {
  id: string;
  fromModuleId: string;
  fromPortName: string;
  toModuleId: string;
  toPortName: string;
}

export type ModuleType =
  | 'Oscillator'
  | 'Filter'
  | 'Gain'
  | 'Delay'
  | 'Reverb'
  | 'Distortion'
  | 'Mixer'
  | 'Destination'
  | 'LFO'
  | 'LFO Sync'
  | 'ADSR'
  | 'Transport'
  | 'Sequencer'
  | 'Sampler'
  | 'TB-303'
  | 'TB-303 Seq'
  | 'Drum Station'
  | 'Looper'
  | 'Sidechain'
  | 'EQ8'
  | 'FM';

export interface PresetData {
  modules: ModuleConfig[];
  connections: Connection[];
}

export interface CablePathData {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  id?: string;
  isPreview?: boolean;
}
