import { Model, Document} from 'mongoose';

export class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(item: T): Promise<Document<unknown, {}, T>> {
    const newItem = new this.model(item);
    return newItem.save();
  }

  async createMany(items: T[]): Promise<T[]> {
    return this.model.insertMany(items);
  }

  async findAll(): Promise<T[]> {
    return this.model.find().exec();
  }

  async findById(id: number): Promise<T | null> {
    return this.model.findOne({ id }).exec();
  }

  async update(id: number, updateData: Partial<T>): Promise<T | null> {
    return this.model
      .findOneAndUpdate({ id }, updateData, { new: true })
      .exec();
  }

  async updateMany(filter: Partial<T>, updateData: Partial<T>): Promise<any> {
    return this.model.updateMany(filter, updateData).exec();
  }

  async delete(id: number): Promise<T | null> {
    return this.model.findOneAndDelete({ id }).exec();
  }
}
