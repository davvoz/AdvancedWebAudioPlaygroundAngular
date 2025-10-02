import { Component, OnInit, ViewChild, ElementRef, inject, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaletteComponent } from '../../../shared/components/palette/palette';
import { AudioModuleComponent } from '../../modules/audio-module/audio-module';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { ModuleConfig, Connection, Position } from '../../../shared/models/module.model';

@Component({
  selector: 'app-workspace',
  imports: [CommonModule, PaletteComponent, AudioModuleComponent],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss'
})
export class WorkspaceComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('workspace', { static: false }) workspaceRef!: ElementRef<HTMLDivElement>;

  private workspaceService = inject(WorkspaceService);
  
  modules = this.workspaceService.modulesSignal;
  connections = this.workspaceService.connectionsSignal;
  
  zoom = signal(1.0);
  modulePositions = new Map<string, Position>();
  
  private linking: {
    fromModuleId: string;
    fromPortName: string;
    mousePos: Position;
  } | null = null;

  private dragging: {
    moduleId: string;
    startPos: Position;
    offsetX: number;
    offsetY: number;
  } | null = null;

  private ctx!: CanvasRenderingContext2D;
  private animationId?: number;

  ngOnInit(): void {
    // Load initial preset
    this.createDefaultExample();
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
    this.startRenderLoop();

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const workspace = this.workspaceRef.nativeElement;
    canvas.width = workspace.clientWidth;
    canvas.height = workspace.clientHeight;
  }

  private startRenderLoop(): void {
    const render = () => {
      this.drawConnections();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  private drawConnections(): void {
    if (!this.ctx) return;
    
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all connections
    this.connections().forEach((conn) => {
      const fromPos = this.modulePositions.get(conn.fromModuleId);
      const toPos = this.modulePositions.get(conn.toModuleId);
      
      if (fromPos && toPos) {
        this.drawCable(fromPos, toPos, '#58a6ff', false);
      }
    });

    // Draw linking cable if active
    if (this.linking) {
      const fromPos = this.modulePositions.get(this.linking.fromModuleId);
      if (fromPos) {
        this.drawCable(fromPos, this.linking.mousePos, '#7ee787', true);
      }
    }
  }

  private drawCable(from: Position, to: Position, color: string, dashed: boolean): void {
    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    
    if (dashed) {
      this.ctx.setLineDash([5, 5]);
    } else {
      this.ctx.setLineDash([]);
    }

    // Bezier curve for nice cable effect
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const cp1x = from.x + dx * 0.5;
    const cp1y = from.y;
    const cp2x = to.x - dx * 0.5;
    const cp2y = to.y;

    this.ctx.moveTo(from.x, from.y);
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, to.x, to.y);
    this.ctx.stroke();
  }

  onModuleCreated(event: { type: string; position: Position }): void {
    const id = `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const config: ModuleConfig = {
      id,
      type: event.type as any,
      position: event.position
    };
    
    this.workspaceService.createModule(config);
    this.modulePositions.set(id, event.position);
  }

  onWorkspaceDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }

  onWorkspaceDrop(event: DragEvent): void {
    event.preventDefault();
    
    const moduleType = event.dataTransfer!.getData('text/plain');
    if (!moduleType) return;

    const workspace = this.workspaceRef.nativeElement;
    const rect = workspace.getBoundingClientRect();
    const position: Position = {
      x: (event.clientX - rect.left) / this.zoom(),
      y: (event.clientY - rect.top) / this.zoom()
    };

    this.onModuleCreated({ type: moduleType, position });
  }

  onModuleMoved(event: { id: string; position: Position }): void {
    this.modulePositions.set(event.id, event.position);
  }

  onModuleDragStart(event: { id: string; offsetX: number; offsetY: number }): void {
    const currentPos = this.modulePositions.get(event.id);
    if (currentPos) {
      // Convert offset to workspace coordinates (accounting for zoom)
      this.dragging = {
        moduleId: event.id,
        startPos: currentPos,
        offsetX: event.offsetX / this.zoom(),
        offsetY: event.offsetY / this.zoom()
      };
    }
  }

  onModuleDragEnd(): void {
    this.dragging = null;
  }

  onModuleRemoved(id: string): void {
    this.workspaceService.removeModule(id);
    this.modulePositions.delete(id);
  }

  onPortClick(event: { moduleId: string; portName: string; direction: 'input' | 'output' }): void {
    if (event.direction === 'output') {
      // Start linking
      this.linking = {
        fromModuleId: event.moduleId,
        fromPortName: event.portName,
        mousePos: this.modulePositions.get(event.moduleId) || { x: 0, y: 0 }
      };
    } else if (this.linking && event.direction === 'input') {
      // Complete connection
      const connId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const connection: Connection = {
        id: connId,
        fromModuleId: this.linking.fromModuleId,
        fromPortName: this.linking.fromPortName,
        toModuleId: event.moduleId,
        toPortName: event.portName
      };
      
      this.workspaceService.createConnection(connection);
      this.linking = null;
    }
  }

  onWorkspaceMouseMove(event: MouseEvent): void {
    const workspace = this.workspaceRef.nativeElement;
    const rect = workspace.getBoundingClientRect();
    
    if (this.linking) {
      this.linking.mousePos = {
        x: (event.clientX - rect.left) / this.zoom(),
        y: (event.clientY - rect.top) / this.zoom()
      };
    }
    
    if (this.dragging) {
      const newPos: Position = {
        x: (event.clientX - rect.left) / this.zoom() - this.dragging.offsetX,
        y: (event.clientY - rect.top) / this.zoom() - this.dragging.offsetY
      };
      this.modulePositions.set(this.dragging.moduleId, newPos);
      this.onModuleMoved({ id: this.dragging.moduleId, position: newPos });
    }
  }

  onWorkspaceClick(event: MouseEvent): void {
    if (event.target === this.workspaceRef.nativeElement && this.linking) {
      // Cancel linking
      this.linking = null;
    }
  }

  onWorkspaceMouseUp(): void {
    this.dragging = null;
  }

  zoomIn(): void {
    this.zoom.update(z => Math.min(z + 0.1, 2.0));
  }

  zoomOut(): void {
    this.zoom.update(z => Math.max(z - 0.1, 0.4));
  }

  resetZoom(): void {
    this.zoom.set(1.0);
  }

  private createDefaultExample(): void {
    // Create a simple example: Oscillator -> Filter -> Gain -> Destination
    const oscConfig: ModuleConfig = {
      id: 'osc-1',
      type: 'Oscillator',
      position: { x: 100, y: 200 },
      state: { type: 'sawtooth', freq: 220, level: 0.3 }
    };
    
    const filterConfig: ModuleConfig = {
      id: 'filter-1',
      type: 'Filter',
      position: { x: 400, y: 200 },
      state: { type: 'lowpass', cutoff: 1000, q: 5 }
    };
    
    const gainConfig: ModuleConfig = {
      id: 'gain-1',
      type: 'Gain',
      position: { x: 700, y: 200 },
      state: { gain: 0.5 }
    };
    
    const destConfig: ModuleConfig = {
      id: 'dest-1',
      type: 'Destination',
      position: { x: 1000, y: 200 },
      state: { level: 0.8 }
    };

    this.workspaceService.createModule(oscConfig);
    this.workspaceService.createModule(filterConfig);
    this.workspaceService.createModule(gainConfig);
    this.workspaceService.createModule(destConfig);

    this.modulePositions.set('osc-1', oscConfig.position);
    this.modulePositions.set('filter-1', filterConfig.position);
    this.modulePositions.set('gain-1', gainConfig.position);
    this.modulePositions.set('dest-1', destConfig.position);

    // Create connections
    setTimeout(() => {
      this.workspaceService.createConnection({
        id: 'c1',
        fromModuleId: 'osc-1',
        fromPortName: 'out',
        toModuleId: 'filter-1',
        toPortName: 'in'
      });

      this.workspaceService.createConnection({
        id: 'c2',
        fromModuleId: 'filter-1',
        fromPortName: 'out',
        toModuleId: 'gain-1',
        toPortName: 'in'
      });

      this.workspaceService.createConnection({
        id: 'c3',
        fromModuleId: 'gain-1',
        fromPortName: 'out',
        toModuleId: 'dest-1',
        toPortName: 'in'
      });
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
