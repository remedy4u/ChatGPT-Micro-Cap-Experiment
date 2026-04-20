import { Body, Controller, Get, Post } from '@nestjs/common';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './lead.dto';

@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  create(@Body() body: CreateLeadDto) {
    return this.leadService.create(body);
  }

  @Get()
  list() {
    return this.leadService.list();
  }
}
