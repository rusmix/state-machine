import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ToggleModule } from './toggles/toggles.module';
import { SessionModule } from './session/session.module';
import { ControlledItemModule } from './controlled-item/controlled-item.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017'),
    ToggleModule,
    ControlledItemModule,
    SessionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
