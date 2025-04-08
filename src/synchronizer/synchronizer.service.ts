import { Injectable } from '@nestjs/common';
import { ControlledItemRepository } from '../controlled-item/controlled-item.repository';
import { ToggleRepository } from '../toggles/toggles.repository';
import { Types } from 'mongoose';
import { ControlledItem } from 'src/controlled-item/controlled-item.model';
import { SessionRepository } from 'src/session/session.repository';
import { IToggle } from 'src/toggles/toggles.model';
import { SessionWithItems } from 'src/session/session.controller';

@Injectable()
export class SynchronizerService {
  constructor(
    private readonly controlledItemRepository: ControlledItemRepository,
    private readonly toggleRepository: ToggleRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async updateSessionState(session: SessionWithItems): Promise<void> {
    const { sessionId, items, toggles } = session;
  
    const existingItems = await this.controlledItemRepository.findBySessionId(sessionId);
    const existingToggles = await this.toggleRepository.findBySessionId(sessionId);
  
    const itemMap = new Map<number, ControlledItem>(existingItems.map((item) => [item.id, item]));
    const toggleMap = new Map<number, IToggle>(existingToggles.map((toggle) => [toggle.id, toggle]));
  
    const updatedItems = new Map<number, ControlledItem>();
    const updatedToggles = new Map<number, IToggle>();
  
    for (const item of items) {
      const existingItem = itemMap.get(item.id);
      if (!existingItem || JSON.stringify(existingItem) !== JSON.stringify(item)) {
        updatedItems.set(item.id, item);
        itemMap.set(item.id, item);
      }
    }
  
    for (const toggle of toggles) {
      const existingToggle = toggleMap.get(toggle.id);
      if (!existingToggle || JSON.stringify(existingToggle) !== JSON.stringify(toggle)) {
        updatedToggles.set(toggle.id, toggle);
        toggleMap.set(toggle.id, toggle);
      }
    }

    const dependencyGraph = this.buildDependencyGraph(itemMap);
  
    for (const [itemId, item] of updatedItems) {
      await this.updateDependencies(itemId, dependencyGraph, itemMap, toggleMap);
    }

    await Promise.all([
      this.controlledItemRepository.updateMany([...updatedItems.values()]),
      this.toggleRepository.updateMany([...updatedToggles.values()]),
    ]);
  }

  private buildDependencyGraph(itemMap: Map<number, ControlledItem>): Map<number, number[]> {
    const graph = new Map<number, number[]>();
  
    for (const [id, item] of itemMap) {
      graph.set(id, item.dependencyItems || []);
    }
  
    return graph;
  }

  private async updateDependencies(
    itemId: number,
    dependencyGraph: Map<number, number[]>,
    itemMap: Map<number, ControlledItem>,
    toggleMap: Map<number, IToggle>,
  ): Promise<void> {
    const item = itemMap.get(itemId);
    if (!item) return;
  
    const dependencies = dependencyGraph.get(itemId) || [];
  
    for (const dependentId of dependencies) {
      const dependentItem = itemMap.get(dependentId);
      if (dependentItem) {
        if (item.type === 'discrete' && dependentItem.type === 'discrete') {
          dependentItem.discrete_value = item.discrete_value;
        } else if (item.type === 'analog' && dependentItem.type === 'analog') {
          dependentItem.analog_value = item.analog_value;
        }
  
        await this.updateDependencies(dependentId, dependencyGraph, itemMap, toggleMap);
      }
    }
  }
  

  async addToggleToControlledItem(
    controlledItemId: number,
    toggleId: number,
  ): Promise<void> {
    await this.controlledItemRepository.addToggleToControlledItem(
      controlledItemId,
      toggleId,
    );

    await this.toggleRepository.addControlledItemToToggle(
      toggleId,
      controlledItemId,
    );
  }

  async removeToggleFromControlledItem(
    controlledItemId: number,
    toggleId: number,
  ): Promise<void> {
    await this.controlledItemRepository.removeToggleFromControlledItem(
      controlledItemId,
      toggleId,
    );

    await this.toggleRepository.removeControlledItemFromToggle(
      toggleId,
      controlledItemId,
    );
  }

  async createSession(
    sessionName: string,
    items: ControlledItem[],
    toggles: IToggle[],
  ): Promise<void> {
    const currentId = await this.sessionRepository.getMaxId();
    const session = await this.sessionRepository.create({
      id: currentId + 1,
      name: sessionName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  
    const sessionId = session.id;
  
    for (const item of items) {
      item.session_id = sessionId;
    }
  
    for (const toggle of toggles) {
      toggle.session_id = sessionId;
    }
  
    this.checkForCircularDependencies(items);
  
    await Promise.all([
      this.controlledItemRepository.createMany(items),
      this.toggleRepository.createMany(toggles),
    ]);
  
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const toggleIndexes = item.toggles || [];
      for (const index of toggleIndexes) {
        const toggle = toggles[index];
        await this.controlledItemRepository.addToggleToControlledItem(
          item.id,
          toggle.id,
        );
        await this.toggleRepository.addControlledItemToToggle(
          toggle.id,
          item.id,
        );
      }
    }
  }
  
  private checkForCircularDependencies(items: ControlledItem[]): void {
    const dependencyGraph = new Map<number, number[]>();
  
    for (const item of items) {
      dependencyGraph.set(item.id, item.dependencyItems || []);
    }
  
    const visited = new Set<number>();
    const inStack = new Set<number>();
  
    const hasCycle = (node: number): boolean => {
      if (inStack.has(node)) {
        return true;
      }
      if (visited.has(node)) {
        return false;
      }
  
      visited.add(node);
      inStack.add(node);
  
      for (const neighbor of dependencyGraph.get(node) || []) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }
  
      inStack.delete(node);
      return false;
    };
  
    for (const itemId of dependencyGraph.keys()) {
      if (hasCycle(itemId)) {
        throw new Error(`Циркулярная зависимость найдена для элемента с id: ${itemId}`);
      }
    }
  }
  
}
