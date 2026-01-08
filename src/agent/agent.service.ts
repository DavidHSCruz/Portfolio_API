import { GoogleGenAI } from '@google/genai';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { GithubService } from '../github/github.service';
import { GithubProject } from '../github/github.interface';

@Injectable()
export class AgentService {
  private ai: GoogleGenAI;
  private curriculum: string;

  constructor(
    private readonly config: ConfigService,
    private readonly githubService: GithubService,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.ai = new GoogleGenAI({ apiKey });

    const curriculumPath = path.join(
      process.cwd(),
      'src',
      'agent',
      'curriculum.md',
    );
    const curriculumPathDist = path.join(__dirname, 'curriculum.md');

    let loadedPath = '';
    if (fs.existsSync(curriculumPath)) {
      this.curriculum = fs.readFileSync(curriculumPath, 'utf8');
      loadedPath = curriculumPath;
    } else if (fs.existsSync(curriculumPathDist)) {
      this.curriculum = fs.readFileSync(curriculumPathDist, 'utf8');
      loadedPath = curriculumPathDist;
    } else {
      this.curriculum = 'Currículo não fornecido.';
      loadedPath = 'Não encontrado';
    }

    console.log('Currículo carregado de:', loadedPath);
  }

  /**
   * Responde somente sobre o currículo e carreira do David.
   * Se a pergunta estiver fora do escopo, retorna uma mensagem de recusa.
   */
  async postChat(message: string): Promise<string> {
    // Remove acentos da mensagem
    const text = (message || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Detecta intenção específica sobre projetos
    const wantsProjects =
      /(\bprojeto\b|\bprojetos\b|repositorio|reposit[óo]rio|repositorios|reposit[óo]rios|github)/.test(
        text,
      );

    // Se perguntar sobre projetos, buscar dados atuais no GitHub
    let projectsContextMd = '';
    if (wantsProjects) {
      try {
        const rawRepos = await this.githubService.listRepos();
        // Força a tipagem assumindo que o retorno segue a estrutura esperada
        const repos = rawRepos as unknown as GithubProject[];

        if (repos && repos.length > 0) {
          const projectsInfo = repos
            .map((r: GithubProject) => {
              const name = r.name || 'Sem nome';
              const link = r.url ?? r.homepage ?? '';
              const desc = r.description ?? 'Sem descrição';
              const tags =
                Array.isArray(r.tags) && r.tags.length > 0
                  ? r.tags.join(', ')
                  : 'Sem tags';
              const lang = r.language ?? 'N/A';

              return `- **${name}** (${lang}): ${desc}\n  *Tags*: ${tags}\n  *Link*: ${link}`;
            })
            .join('\n\n');

          projectsContextMd = `\n\nLista de Projetos do GitHub (USE ESTES DADOS SE PERGUNTADO SOBRE PROJETOS):\n${projectsInfo}`;
        }
      } catch (error) {
        console.error('Erro ao buscar projetos do GitHub:', error);
      }
    }

    const systemInstruction = `
    Você é um assistente amigavel que conhece o conteúdo a seguir (o David, seu currículo e sua carreira).
    Responda com informações presentes nesse currículo, sempre fazendo perguntas ou dando sugestões para complementar o que o recrutador pode perguntar.
    responda em português, pode também utilizar emojis para tornar a resposta mais divertida.

    Se perguntar sobre como entrar em contato, telefone, whatsapp, whats, email, redes sociais, ou outras formas de comunicação, responda somente: "#contato".

    Se perguntar sobre o David, fale quem é o David, sua carreira e como ele pode contribuir para a nova área de trabalho.
    Se perguntar sobre experiências do David, explique como elas podem somar para a nova área de trabalho.

    Se a pergunta não puder ser respondida principalmente com as informações presentes no currículo, responda algo como: 
    Exemplo: "Infelismente não tenho essa informação, preciso conhece-lo melhor nessa parte..." e volte ao foco do que deve ser conversado. 

    Quando perguntarem sobre projetos, utilize também o contexto de projetos abaixo para responder de forma atualizada. Formate a resposta com Markdown quando útil (listas, links).

    Currículo:
    ${this.curriculum}
    ${projectsContextMd}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: { systemInstruction },
      });

      return response.text || 'Sem resposta do modelo.';
    } catch (error) {
      console.error('Erro ao gerar conteúdo com o modelo:', error);

      throw new HttpException(
        'Erro ao processar a solicitação com a IA.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
