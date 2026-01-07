export interface GithubProject {
  id: number;
  name: string;
  description: string;
  tags: string[];
  image: string | null;
  language: string | null;
  url: string | null;
  private: boolean;
  homepage: string | null;
  updated_at: string | null;
}
