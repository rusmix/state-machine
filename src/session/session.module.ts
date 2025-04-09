import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionSchema } from './session.model';
import { SessionRepository } from './session.repository';
import { SessionService } from './session.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Session', schema: SessionSchema }]),
  ],
  providers: [SessionRepository, SessionService],
  exports: [SessionService, SessionRepository],
})
export class SessionModule {}
