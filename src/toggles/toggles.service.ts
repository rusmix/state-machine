import { Injectable } from '@nestjs/common';
import { ToggleRepository } from './toggles.repository';
import { IToggle } from './toggles.model';

@Injectable()
export class ToggleService {
  constructor(private readonly toggleRepository: ToggleRepository) {}

  async createToggle(toggle: IToggle): Promise<IToggle> {
    return this.toggleRepository.create(toggle);
  }

  async findAllToggles(): Promise<IToggle[]> {
    return this.toggleRepository.findAll();
  }

  async findToggleById(id: number): Promise<IToggle | null> {
    return this.toggleRepository.findById(id);
  }

  async updateToggle(
    id: number,
    updateData: Partial<IToggle>,
  ): Promise<IToggle | null> {
    return this.toggleRepository.update(id, updateData);
  }

  async deleteToggle(id: number): Promise<IToggle | null> {
    return this.toggleRepository.delete(id);
  }
}
