import { Module } from '@nestjs/common';
import { SynchronizerService } from './synchronizer.service'; // Импортируем SynchronizerService
import { ToggleModule } from '../toggles/toggles.module';
import { SessionModule } from '../session/session.module'; // Сервис для сессий

@Module({
  imports: [ToggleModule, SessionModule],
  providers: [SynchronizerService],
  exports: [SynchronizerService], // Экспортируем сервис, чтобы его можно было использовать в других модулях
})
export class SynchronizerModule {}
