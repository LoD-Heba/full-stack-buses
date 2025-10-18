import { Module } from '@nestjs/common';
import { QRService } from './qr.service';

@Module({
  providers: [QRService],
  exports: [QRService],
})
export class QRModule {}