import { Injectable } from '@nestjs/common';
import { ControlledItemRepository } from './controlled-item.repository';
import { ControlledItem } from './controlled-item.model';

@Injectable()
export class ControlledItemService {
  constructor(
    private readonly controlledItemRepository: ControlledItemRepository,
  ) {}

  // Создание нового устройства
  async createControlledItem(
    controlledItem: ControlledItem,
  ): Promise<ControlledItem> {
    return this.controlledItemRepository.create(controlledItem);
  }

  // Получение всех устройств
  async findAllControlledItems(): Promise<ControlledItem[]> {
    return this.controlledItemRepository.findAll();
  }

  // Поиск устройства по ID
  async findControlledItemById(id: number): Promise<ControlledItem | null> {
    return this.controlledItemRepository.findById(id);
  }

  // Обновление устройства
  async updateControlledItem(
    id: number,
    updateData: Partial<ControlledItem>,
  ): Promise<ControlledItem | null> {
    return this.controlledItemRepository.update(id, updateData);
  }

  // Удаление устройства
  async deleteControlledItem(id: number): Promise<ControlledItem | null> {
    return this.controlledItemRepository.delete(id);
  }
}
