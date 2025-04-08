import { Controller, Post, Body } from '@nestjs/common';
import { ControlledItem } from 'src/controlled-item/controlled-item.model';
import { SynchronizerService } from 'src/synchronizer/synchronizer.service';
import { IToggle } from 'src/toggles/toggles.model';

@Controller('sessions')
export class SessionController {
  constructor(private readonly synchronizerService: SynchronizerService) {}

  @Post()
  async createSession(
    @Body()
    {
      items,
      toggles,
      sessionName,
    }: {
      items: ControlledItem[];
      toggles: IToggle[];
      sessionName: string;
    },
  ) {
    await this.synchronizerService.createSession(sessionName, items, toggles);
    return { message: 'Session created successfully' };
  }
}

interface InitialSession {
  items: ControlledItem[];
  toggles: IToggle[];
  sessionName: string;
}

export interface SessionWithItems {
  sessionId: number;
  items: ControlledItem[];
  toggles: IToggle[];
}

