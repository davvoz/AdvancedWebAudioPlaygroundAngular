import { Injectable, inject } from '@angular/core';
import { AudioContextService } from './audio-context.service';
import { ModuleConfig, ModuleType } from '../../shared/models/module.model';
import { BaseAudioModule } from '../audio-modules/base-audio-module';
import { ADSRModule } from '../audio-modules/adsr.module';
import { DelayModule } from '../audio-modules/delay.module';
import { DestinationModule } from '../audio-modules/destination.module';
import { DistortionModule } from '../audio-modules/distortion.module';
import { FilterModule } from '../audio-modules/filter.module';
import { GainModule } from '../audio-modules/gain.module';
import { LFOModule } from '../audio-modules/lfo.module';
import { OscillatorModule } from '../audio-modules/oscillator.module';
import { ReverbModule } from '../audio-modules/reverb.module';
import { SamplerModule } from '../audio-modules/sampler.module';
import { SequencerModule } from '../audio-modules/sequencer.module';
import { TransportModule } from '../audio-modules/transport.module';
import { FMModule } from '../audio-modules/fm.module';


@Injectable({
  providedIn: 'root'
})
export class ModuleFactoryService {
  private audioCtxService = inject(AudioContextService);

  createModule(config: ModuleConfig): BaseAudioModule {
    const audioCtx = this.audioCtxService.getContext();
    
    const moduleMap: Record<ModuleType, new (config: ModuleConfig, ctx: AudioContext) => BaseAudioModule> = {
      'Oscillator': OscillatorModule,
      'Filter': FilterModule,
      'Gain': GainModule,
      'Delay': DelayModule,
      'Reverb': ReverbModule,
      'Distortion': DistortionModule,
      'Mixer': GainModule, // Placeholder
      'Destination': DestinationModule,
      'LFO': LFOModule,
      'LFO Sync': LFOModule, // Placeholder
      'ADSR': ADSRModule,
      'Transport': TransportModule,
      'Sequencer': SequencerModule,
      'Sampler': SamplerModule,
      'TB-303': OscillatorModule, // Placeholder
      'TB-303 Seq': SequencerModule, // Placeholder
      'Drum Station': SamplerModule, // Placeholder
      'Looper': SamplerModule, // Placeholder
      'Sidechain': GainModule, // Placeholder
      'EQ8': FilterModule, // Placeholder
      'FM': FMModule
    };

    const ModuleClass = moduleMap[config.type];
    if (!ModuleClass) {
      throw new Error(`Unknown module type: ${config.type}`);
    }

    return new ModuleClass(config, audioCtx);
  }

  getAvailableModuleTypes(): ModuleType[] {
    return [
      'Oscillator',
      'Filter',
      'Gain',
      'Delay',
      'Reverb',
      'Distortion',
      'Mixer',
      'Destination',
      'LFO',
      'LFO Sync',
      'ADSR',
      'Transport',
      'Sequencer',
      'Sampler',
      'TB-303',
      'TB-303 Seq',
      'Drum Station',
      'Looper',
      'Sidechain',
      'EQ8',
      'FM'
    ];
  }
}
