import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IToggle, ToggleDocument } from './toggles.model';

@Injectable()
export class ToggleRepository {
  constructor(
    @InjectModel('Toggle') private readonly toggleModel: Model<ToggleDocument>,
  ) {}

  async createMany(toggles: IToggle[]): Promise<IToggle[]> {
    return this.toggleModel.insertMany(toggles);
  }

  async create(toggle: IToggle): Promise<IToggle> {
    const newToggle = new this.toggleModel(toggle);
    return newToggle.save();
  }

  async findAll(): Promise<IToggle[]> {
    return this.toggleModel.find().exec();
  }

  async findById(id: number): Promise<IToggle | null> {
    return this.toggleModel.findOne({ id }).exec();
  }

  async update(
    id: number,
    updateData: Partial<IToggle>,
  ): Promise<IToggle | null> {
    return this.toggleModel
      .findOneAndUpdate({ id }, updateData, { new: true })
      .exec();
  }

  async delete(id: number): Promise<IToggle | null> {
    return this.toggleModel.findOneAndDelete({ id }).exec();
  }

  // Добавление устройства к переключателю
  async addControlledItemToToggle(
    toggleId: number,
    controlledItemId: number,
  ): Promise<IToggle | null> {
    return this.toggleModel
      .findOneAndUpdate(
        { id: toggleId },
        { $push: { controlled_items: controlledItemId } },
        { new: true },
      )
      .exec();
  }

  // Удаление устройства из переключателя
  async removeControlledItemFromToggle(
    toggleId: number,
    controlledItemId: number,
  ): Promise<IToggle | null> {
    return this.toggleModel
      .findOneAndUpdate(
        { id: toggleId },
        { $pull: { controlled_items: controlledItemId } },
        { new: true },
      )
      .exec();
  }

  async updateMany(items: IToggle[]): Promise<IToggle[]> {
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { id: item.id }, 
        update: { $set: item },  
        upsert: true,
      },
    }));
  
    await this.toggleModel.bulkWrite(bulkOps);
  
    return this.toggleModel.find({
      id: { $in: items.map((item) => item.id) },
    });
  }

  async findBySessionId(sessionId): Promise<IToggle[] | null> {
    return this.toggleModel.find({ session_id: sessionId}).exec(); 
   }
  
}
