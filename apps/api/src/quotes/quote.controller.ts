import { Body, Controller, Post } from '@nestjs/common';
import { QuoteService } from './quote.service';

@Controller('quotes')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post('preview')
  preview(@Body() body: { leadId: string }) {
    return this.quoteService.preview(body.leadId);
  }
}
