import { Module } from '@nestjs/common';
import { SynchronizerModule } from '../synchronizer/synchronizer.module';
import { SessionModule } from '../session/session.module';
import { StateGateway } from './websocket.service'; // Сервис для сессий

@Module({
  imports: [SynchronizerModule, SessionModule],
  providers: [StateGateway],
  exports: [StateGateway],
})
export class StateGatewayModule {}
