import { Injectable, signal } from '@angular/core';
import { Connection, ModuleConfig } from '../../shared/models/module.model';
import { BaseAudioModule } from '../audio-modules/base-audio-module';
import { ModuleFactoryService } from './module-factory.service';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private modules = new Map<string, BaseAudioModule>();
  private connections = new Map<string, Connection>();
  
  public modulesSignal = signal<Map<string, BaseAudioModule>>(new Map());
  public connectionsSignal = signal<Map<string, Connection>>(new Map());

  constructor(private moduleFactory: ModuleFactoryService) {}

  createModule(config: ModuleConfig): BaseAudioModule {
    const module = this.moduleFactory.createModule(config);
    this.modules.set(config.id, module);
    this.modulesSignal.set(new Map(this.modules));
    return module;
  }

  removeModule(id: string): void {
    const module = this.modules.get(id);
    if (module) {
      // Remove all connections
      const connectionsToRemove: string[] = [];
      this.connections.forEach((conn, connId) => {
        if (conn.fromModuleId === id || conn.toModuleId === id) {
          connectionsToRemove.push(connId);
        }
      });
      connectionsToRemove.forEach(connId => this.removeConnection(connId));

      // Dispose module
      module.dispose();
      this.modules.delete(id);
      this.modulesSignal.set(new Map(this.modules));
    }
  }

  getModule(id: string): BaseAudioModule | undefined {
    return this.modules.get(id);
  }

  getAllModules(): Map<string, BaseAudioModule> {
    return new Map(this.modules);
  }

  createConnection(connection: Connection): void {
    const fromModule = this.modules.get(connection.fromModuleId);
    const toModule = this.modules.get(connection.toModuleId);

    if (!fromModule || !toModule) {
      console.error('Cannot create connection: module not found');
      return;
    }

    // Disconnect any existing connection to the input port
    this.connections.forEach((conn, id) => {
      if (conn.toModuleId === connection.toModuleId && 
          conn.toPortName === connection.toPortName) {
        this.removeConnection(id);
      }
    });

    // Create the connection
    fromModule.connect(connection.fromPortName, toModule, connection.toPortName);
    this.connections.set(connection.id, connection);
    this.connectionsSignal.set(new Map(this.connections));
  }

  removeConnection(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      const fromModule = this.modules.get(connection.fromModuleId);
      const toModule = this.modules.get(connection.toModuleId);
      
      if (fromModule && toModule) {
        fromModule.disconnect(connection.fromPortName, toModule, connection.toPortName);
      }
      
      this.connections.delete(id);
      this.connectionsSignal.set(new Map(this.connections));
    }
  }

  getConnection(id: string): Connection | undefined {
    return this.connections.get(id);
  }

  getConnectionsFrom(moduleId: string): Connection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.fromModuleId === moduleId
    );
  }

  getConnectionsTo(moduleId: string): Connection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.toModuleId === moduleId
    );
  }

  getAllConnections(): Map<string, Connection> {
    return new Map(this.connections);
  }

  clear(): void {
    // Dispose all modules
    this.modules.forEach(module => module.dispose());
    
    this.modules.clear();
    this.connections.clear();
    this.modulesSignal.set(new Map());
    this.connectionsSignal.set(new Map());
  }

  exportState(): { modules: ModuleConfig[]; connections: Connection[] } {
    const modulesArray: ModuleConfig[] = [];
    
    this.modules.forEach(module => {
      modulesArray.push({
        id: module.id,
        type: module.type as any,
        position: { x: 0, y: 0 }, // Will be updated by UI component
        state: module.getState()
      });
    });

    const connectionsArray = Array.from(this.connections.values());

    return {
      modules: modulesArray,
      connections: connectionsArray
    };
  }

  importState(data: { modules: ModuleConfig[]; connections: Connection[] }): void {
    this.clear();

    // Create modules
    data.modules.forEach(config => {
      this.createModule(config);
    });

    // Create connections
    data.connections.forEach(conn => {
      this.createConnection(conn);
    });
  }
}
