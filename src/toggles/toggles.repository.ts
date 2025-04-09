import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IToggle, ToggleDocument } from './toggles.model';
import { IToggleInitial } from './types';

@Injectable()
export class ToggleRepository {
  constructor(
    @InjectModel('Toggle') private readonly toggleModel: Model<ToggleDocument>,
  ) {}

  async createMany(toggles: IToggleInitial[]): Promise<IToggle[]> {
    const maxId = await this.getMaxId();
    const startId = maxId + 1;
    const togglesToCreate = toggles.map((toggle, index) => {
      return { ...toggle, id: startId + index } as IToggle;
    });
    return this.toggleModel.insertMany(togglesToCreate);
  }

  async create(toggle: IToggle): Promise<IToggle> {
    const newToggle = new this.toggleModel(toggle);
    return newToggle.save();
  }

  async findAll(): Promise<IToggle[]> {
    return this.toggleModel.find().exec();
  }

  async findTogglesBySessionId(sessionId: number): Promise<IToggle[]> {
    return this.toggleModel.find({ session_id: sessionId }).exec();
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
    return this.toggleModel.find({ session_id: sessionId }).exec();
  }

  async getMaxId(): Promise<number> {
    const maxToggle = await this.toggleModel
      .findOne({})
      .sort({ id: -1 })
      .exec();

    return maxToggle ? maxToggle.id : 0;
  }
}
