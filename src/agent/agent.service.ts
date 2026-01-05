import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AgentService {
  private ai: GoogleGenAI;
  private curriculum: string;
  private allowedKeywords = [
    'currículo',
    'curriculo',
    'cv',
    'experiência',
    'experiencia',
    'formação',
    'formacao',
    'habilidades',
    'habilidade',
    'projetos',
    'vaga',
    'carreira',
    'david',
    'ola',
    'olá',
    'oi',
    'ajuda',
    'bom',
    'boa',
    'tarde',
    'noite',
    'dia',
    'quem',
    'voce',
    'você',
    'sobre',
    'info',
  ];

  constructor(private readonly config: ConfigService) {
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
    const text = (message || '').toLowerCase();
    const inScope = this.allowedKeywords.some((kw) => text.includes(kw));

    if (!inScope) {
      return 'Desculpe, só posso responder sobre o currículo e carreira do David.';
    }

    const systemInstruction = `
    Você é um assistente amigavel que conhece o conteúdo a seguir (o David, seu currículo e sua carreira). 
    Responda com informações presentes nesse currículo, fazendo perguntas ou dando sugestões se precisar. 
    Se a pergunta não puder ser respondida com o currículo, responda: 
    "Não tenho essa informação."\n\nCurrículo:\n${this.curriculum}
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: { systemInstruction },
    });

    return response?.text || 'Sem resposta do modelo.';
  }
}
