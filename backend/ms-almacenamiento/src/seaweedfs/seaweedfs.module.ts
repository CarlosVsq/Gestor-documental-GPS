import { Module } from '@nestjs/common';
import { SeaweedFsService } from './seaweedfs.service';

@Module({
  providers: [SeaweedFsService],
  exports: [SeaweedFsService],
})
export class SeaweedFsModule {}
