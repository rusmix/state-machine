import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ControlledItem,
  ControlledItemDocument,
} from './controlled-item.model';

@Injectable()
export class ControlledItemRepository {
  constructor(
    @InjectModel('ControlledItem')
    private readonly controlledItemModel: Model<ControlledItemDocument>,
  ) {}

  // Создание нового устройства
  async create(controlledItem: ControlledItem): Promise<ControlledItem> {
    const newItem = new this.controlledItemModel(controlledItem);
    return newItem.save();
  }

  // Получение всех устройств
  async findAll(): Promise<ControlledItem[]> {
    return this.controlledItemModel.find().exec();
  }

  // Поиск устройства по ID
  async findById(id: number): Promise<ControlledItem | null> {
    return this.controlledItemModel.findOne({ id }).exec();
  }

  // Обновление устройства
  async update(
    id: number,
    updateData: Partial<ControlledItem>,
  ): Promise<ControlledItem | null> {
    return this.controlledItemModel
      .findOneAndUpdate({ id }, updateData, { new: true })
      .exec();
  }

  // Удаление устройства
  async delete(id: number): Promise<ControlledItem | null> {
    return this.controlledItemModel.findOneAndDelete({ id }).exec();
  }
  // Добавление toggle к controlledItem
  async addToggleToControlledItem(
    controlledItemId: number,
    toggleId: number,
  ): Promise<ControlledItem | null> {
    return this.controlledItemModel
      .findOneAndUpdate(
        { id: controlledItemId },
        { $push: { toggles: toggleId } },
        { new: true },
      )
      .exec();
  }

  // Удаление toggle из controlledItem
  async removeToggleFromControlledItem(
    controlledItemId: number,
    toggleId: number,
  ): Promise<ControlledItem | null> {
    return this.controlledItemModel
      .findOneAndUpdate(
        { id: controlledItemId },
        { $pull: { toggles: toggleId } },
        { new: true },
      )
      .exec();
  }

  async createMany(items: ControlledItem[]): Promise<ControlledItem[]> {
    return this.controlledItemModel.insertMany(items);
  }

  async updateMany(items: ControlledItem[]): Promise<ControlledItem[]> {
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { id: item.id }, 
        update: { $set: item },  
        upsert: true,
      },
    }));
  
    await this.controlledItemModel.bulkWrite(bulkOps);
  
    // Возвращаем обновленные элементы (не всегда возможно вернуть точные данные, если добавляются новые)
    return this.controlledItemModel.find({
      id: { $in: items.map((item) => item.id) },
    });
  }
  

  async findBySessionId(sessionId): Promise<ControlledItem[] | null> {
   return this.controlledItemModel.find({ session_id: sessionId}).exec(); 
  }
}
