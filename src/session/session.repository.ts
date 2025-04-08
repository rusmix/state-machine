import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './session.model';

@Injectable()
export class SessionRepository {
  constructor(
    @InjectModel('Session')
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async create(session: Session): Promise<Session> {
    const newSession = new this.sessionModel(session);
    return newSession.save();
  }

  async findAll(): Promise<Session[]> {
    return this.sessionModel.find().exec();
  }

  async findById(id: number): Promise<Session | null> {
    return this.sessionModel.findOne({ id }).exec();
  }

  async update(
    id: number,
    updateData: Partial<Session>,
  ): Promise<Session | null> {
    return this.sessionModel
      .findOneAndUpdate({ id }, updateData, { new: true })
      .exec();
  }

  async delete(id: number): Promise<Session | null> {
    return this.sessionModel.findOneAndDelete({ id }).exec();
  }

  // Метод для получения максимального id среди всех сессий
  async getMaxId(): Promise<number> {
    const maxSession = await this.sessionModel
      .findOne({})
      .sort({ id: -1 }) // Сортируем по id в порядке убывания
      .exec();

    // Возвращаем максимальный id, если сессии существуют, иначе возвращаем 0
    return maxSession ? maxSession.id : 0;
  }
}
