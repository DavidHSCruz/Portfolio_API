import { Body, Controller, Post } from '@nestjs/common';
import { AgentService } from './agent.service';

@Controller('chat')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  async postChat(@Body() body: { message: string }) {
    return await this.agentService.postChat(body.message);
  }
}
