import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SynchronizerModule } from './synchronizer/synchronizer.module';
import { StateGatewayModule } from './websocket-gateway/websocket.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/state-machine'),
    StateGatewayModule,
    SynchronizerModule,
  ],
  providers: [],
})
export class AppModule {}
