import { Controller, Post, Body } from '@nestjs/common';
import { SynchronizerService } from 'src/synchronizer/synchronizer.service';
import { IToggle } from 'src/toggles/toggles.model';
import { SessionService } from './session.service';
import { IToggleInitial } from '../toggles/types';

@Controller('sessions')
export class SessionController {
  constructor(
    private readonly synchronizerService: SynchronizerService,
    private readonly sessionService: SessionService,
  ) {}

  @Post()
  async createSession(
    @Body()
    { toggles, sessionName }: InitialSession,
  ) {
    const { id: sessionId } = await this.sessionService.create({
      name: sessionName,
    });
    await this.synchronizerService.initializeSession(sessionId, toggles);
    return { message: 'Session created successfully' };
  }
}

export interface InitialSession {
  sessionId?: number;
  toggles?: IToggleInitial[];
  sessionName?: string;
}

export interface SessionWithToggles {
  sessionId: number;
  toggles: IToggle[];
}
