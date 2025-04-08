import { Injectable } from '@nestjs/common';
import { SessionRepository } from './session.repository';
import { Session } from './session.model';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async createSession(session: Session): Promise<Session> {
    return this.sessionRepository.create(session);
  }

  async findAllSessions(): Promise<Session[]> {
    return this.sessionRepository.findAll();
  }

  async findSessionById(id: number): Promise<Session | null> {
    return this.sessionRepository.findById(id);
  }

  async updateSession(
    id: number,
    updateData: Partial<Session>,
  ): Promise<Session | null> {
    return this.sessionRepository.update(id, updateData);
  }

  async deleteSession(id: number): Promise<Session | null> {
    return this.sessionRepository.delete(id);
  }
}
