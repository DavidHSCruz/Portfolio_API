// src/github/github.controller.ts
import { Controller, Get } from '@nestjs/common';
import { GithubService } from './github.service';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('user')
  listRepos() {
    return this.githubService.listRepos();
  }
}
