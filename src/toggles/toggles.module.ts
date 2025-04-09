import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ToggleSchema } from './toggles.model';
import { ToggleRepository } from './toggles.repository';
import { ToggleService } from './toggles.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Toggle', schema: ToggleSchema }]),
  ],
  providers: [ToggleRepository, ToggleService],
  exports: [ToggleService, ToggleRepository],
})
export class ToggleModule {}
