import { Module } from '@nestjs/common';
import { DrawerService } from './drawer.service';

@Module({
  imports: [],
  providers: [DrawerService],
  exports: [DrawerService],
})
export class DrawerModule {}
