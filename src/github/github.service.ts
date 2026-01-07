import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { GithubProject } from './github.interface';

@Injectable()
export class GithubService {
  private octokit: Octokit;
  private username = process.env.GITHUB_USERNAME;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  async listRepos(): Promise<GithubProject[]> {
    // 1) Buscar os repositórios
    const repos = await this.octokit.paginate(
      this.octokit.repos.listForAuthenticatedUser,
      {
        visibility: 'all',
        affiliation: 'owner',
        sort: 'pushed',
        per_page: 30,
      },
    );

    if (!repos || repos.length === 0) return [];

    // 2) Tratar os dados
    const deleteRepositories = [
      'portfolio',
      'davidhscruz',
      'escala',
      'projetos',
    ];

    const projetos = repos
      .map(repo => {
        if (
          deleteRepositories.some(delRepo =>
            repo.name.toLowerCase().startsWith(delRepo.toLowerCase()),
          )
        ) {
          return null;
        }

        return {
          id: repo.id,
          name: repo.name,
          description: repo.description || 'Sem descrição',
          tags: repo.topics?.map(tag => tag.toUpperCase()) ?? [],
          image: repo.private
            ? null
            : `https://raw.githubusercontent.com/${this.username}/${repo.name}/refs/heads/main/public/assets/images/capa.png`,
          language: repo.language,
          url: repo.private ? null : repo.html_url,
          private: repo.private,
          homepage: repo.homepage,
          updated_at: repo.updated_at,
        };
      })
      .filter(Boolean);

    return projetos.filter(projeto => projeto !== null);
  }
}
