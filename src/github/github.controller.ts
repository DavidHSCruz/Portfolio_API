// src/github/github.controller.ts
import { Controller, Get } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubProject } from './github.interface';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('user')
  listRepos(): Promise<GithubProject[]> {
    return this.githubService.listRepos();
  }
}
