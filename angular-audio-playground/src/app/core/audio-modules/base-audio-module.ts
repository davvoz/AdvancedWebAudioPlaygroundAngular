import { ModuleConfig, Port } from '../../shared/models/module.model';

export abstract class BaseAudioModule {
  public id: string;
  public type: string;
  public inputs: Map<string, Port> = new Map();
  public outputs: Map<string, Port> = new Map();
  protected state: any = {};

  constructor(
    protected config: ModuleConfig,
    protected audioCtx: AudioContext
  ) {
    this.id = config.id;
    this.type = config.type;
    if (config.state) {
      this.state = { ...config.state };
    }
    this.buildAudio();
  }

  abstract buildAudio(): void;
  abstract getTitle(): string;

  connect(outputPort: string, targetModule: BaseAudioModule, inputPort: string): void {
    const output = this.outputs.get(outputPort);
    const input = targetModule.inputs.get(inputPort);

    if (!output || !input) {
      console.error('Invalid ports for connection', { outputPort, inputPort });
      return;
    }

    try {
      if (output.node && input.node) {
        output.node.connect(input.node);
      } else if (output.node && input.param) {
        output.node.connect(input.param);
      } else {
        console.error('Cannot connect: invalid node or param');
      }
    } catch (error) {
      console.error('Connection error:', error);
    }
  }

  disconnect(outputPort: string, targetModule?: BaseAudioModule, inputPort?: string): void {
    const output = this.outputs.get(outputPort);
    if (!output?.node) return;

    try {
      if (targetModule && inputPort) {
        const input = targetModule.inputs.get(inputPort);
        if (input?.node) {
          output.node.disconnect(input.node);
        } else if (input?.param) {
          output.node.disconnect(input.param);
        }
      } else {
        output.node.disconnect();
      }
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  }

  getState(): any {
    return { ...this.state };
  }

  setState(newState: any): void {
    this.state = { ...this.state, ...newState };
    this.applyState();
  }

  protected applyState(): void {
    // Override in subclasses to apply state to audio nodes
  }

  dispose(): void {
    // Disconnect all outputs
    this.outputs.forEach(output => {
      if (output.node) {
        try {
          output.node.disconnect();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    });
  }

  onAudioStateChange(state: AudioContextState): void {
    // Override in subclasses if needed
  }
}
