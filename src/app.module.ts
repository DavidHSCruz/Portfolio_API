import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AgentModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
