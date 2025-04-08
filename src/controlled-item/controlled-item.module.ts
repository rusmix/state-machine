import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ControlledItemSchema } from './controlled-item.model';
import { ControlledItemRepository } from './controlled-item.repository';
import { ControlledItemService } from './controlled-item.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ControlledItem', schema: ControlledItemSchema },
    ]),
  ],
  providers: [ControlledItemRepository, ControlledItemService],
  exports: [ControlledItemService],
})
export class ControlledItemModule {}
