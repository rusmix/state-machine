import { Injectable, Logger } from '@nestjs/common';
import { ToggleRepository } from '../toggles/toggles.repository';
import { IToggle } from 'src/toggles/toggles.model';
import { SessionWithToggles } from 'src/session/session.controller';
import { IToggleInitial } from '../toggles/types';

@Injectable()
export class SynchronizerService {
  private readonly logger = new Logger(SynchronizerService.name, {
    timestamp: true,
  });
  constructor(private readonly toggleRepository: ToggleRepository) {}
  async updateSessionState(session: SessionWithToggles): Promise<IToggle[]> {
    const { sessionId, toggles } = session;

    const existingToggles =
      await this.toggleRepository.findBySessionId(sessionId);

    const toggleMap = new Map<number, IToggle>(
      existingToggles.map((toggle) => [toggle.id, toggle]),
    );

    const updatedToggles = new Map<number, IToggle>();

    // Фильтруем только те тогглы, которые изменились или не совпадают
    for (const toggle of toggles) {
      const existingToggle = toggleMap.get(toggle.id);
      if (
        !existingToggle ||
        JSON.stringify(existingToggle) !== JSON.stringify(toggle)
      ) {
        updatedToggles.set(toggle.id, toggle);
        toggleMap.set(toggle.id, toggle);
      }
    }

    const dependencyGraph = this.buildDependencyGraph(toggleMap);

    // Начнем с обновления тогглов типа 'switch'
    const updatedSwitchToggles = [...updatedToggles.values()].filter(
      (toggle) => toggle.toggle_type === 'switch',
    );

    for (const toggle of updatedSwitchToggles) {
      await this.updateDependencies(toggle.id, dependencyGraph, toggleMap);
    }

    // Обновляем базы данных
    await this.toggleRepository.updateMany([...updatedToggles.values()]);

    return this.toggleRepository.findTogglesBySessionId(sessionId);
  }

  private buildDependencyGraph(
    toggleMap: Map<number, IToggle>,
  ): Map<number, number[]> {
    const graph = new Map<number, number[]>();

    // Строим граф зависимостей
    for (const [id, toggle] of toggleMap) {
      graph.set(id, toggle.dependency_toggles || []);
    }

    return graph;
  }

  private async updateDependencies(
    toggleId: number,
    dependencyGraph: Map<number, number[]>,
    toggleMap: Map<number, IToggle>,
  ): Promise<void> {
    const toggle = toggleMap.get(toggleId);
    if (!toggle) return;

    const dependencies = dependencyGraph.get(toggleId) || [];

    for (const dependentId of dependencies) {
      const dependentToggle = toggleMap.get(dependentId);
      if (dependentToggle) {
        // Если типы 'switch' и 'item' разные, пропускаем изменение для типа 'item'
        if (toggle.toggle_type === 'switch') {
          if (dependentToggle.toggle_type === 'switch') {
            // Обновляем значения для тогглов типа 'switch'
            this.applySwitchChanges(toggle, dependentToggle);
          } else if (dependentToggle.toggle_type === 'item') {
            // Преобразование значений для типа 'item', если зависимость от 'switch'
            this.applyItemChanges(toggle, dependentToggle);
          }
        }

        // Рекурсивно обновляем зависимости
        await this.updateDependencies(dependentId, dependencyGraph, toggleMap);
      }
    }
  }

  // Применение изменений для тогглов типа 'switch'
  private applySwitchChanges(
    parentToggle: IToggle,
    dependentToggle: IToggle,
  ): void {
    if (
      parentToggle.data_type === 'discrete' &&
      dependentToggle.data_type === 'discrete'
    ) {
      dependentToggle.discrete_value = parentToggle.discrete_value;
    } else if (
      parentToggle.data_type === 'analog' &&
      dependentToggle.data_type === 'analog'
    ) {
      dependentToggle.analog_value = parentToggle.analog_value;
    }
  }

  // Применение изменений для тогглов типа 'item'
  private applyItemChanges(
    parentToggle: IToggle,
    dependentToggle: IToggle,
  ): void {
    if (
      parentToggle.data_type === 'discrete' &&
      dependentToggle.data_type === 'analog'
    ) {
      // Преобразование discrete в analog
      const maxDiscreteValue = parentToggle.position_preset - 1 || 100;
      dependentToggle.analog_value =
        (parentToggle.discrete_value / maxDiscreteValue) * 100; // Преобразование
      this.logger.log(
        `analog value by id ${dependentToggle.id} is ${dependentToggle.analog_value}`,
      );
    } else if (
      parentToggle.data_type === 'analog' &&
      dependentToggle.data_type === 'discrete'
    ) {
      // Преобразование analog в discrete
      const maxAnalogValue = parentToggle.position_preset || 100;
      dependentToggle.discrete_value = Math.round(
        (parentToggle.analog_value / 100) * maxAnalogValue,
      );
    }
  }

  async initializeSession(
    sessionId: number,
    toggles: IToggleInitial[],
  ): Promise<IToggle[]> {
    for (const toggle of toggles) {
      toggle.session_id = sessionId;
    }

    const circularIds = this.checkForCircularDependencies(toggles);
    if (circularIds.length > 0) {
      this.logger.log('Circular dependency found!!');
    }

    const createdToggles = await this.toggleRepository.createMany(
      toggles.map((toggle) => {
        return { ...toggle, dependency_toggles: [] };
      }),
    );

    const localIdToId = {};
    createdToggles.forEach((toggle) => {
      localIdToId[toggle.local_id] = toggle.id;
    });

    const togglesToUpdate = createdToggles.map((toggle) => {
      const matchedToggle = toggles.find(
        (el) => el.local_id === toggle.local_id,
      );
      toggle.dependency_toggles = matchedToggle.dependency_toggles.map(
        (localId) => localIdToId[localId],
      );
      return toggle;
    });

    return this.toggleRepository.updateMany(togglesToUpdate);
  }

  private checkForCircularDependencies(toggles: IToggleInitial[]): number[] {
    const dependencyGraph = new Map<number, number[]>();

    for (const item of toggles) {
      dependencyGraph.set(item.local_id, item.dependency_toggles || []);
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

    const circularDependencies: number[] = [];
    for (const itemId of dependencyGraph.keys()) {
      if (hasCycle(itemId)) {
        circularDependencies.push(itemId);
      }
    }
    return circularDependencies;
  }
}
