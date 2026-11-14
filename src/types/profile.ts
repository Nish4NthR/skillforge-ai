export interface Profile {
  id: string;
  fullName: string;
  githubUsername?: string | null;
  hoursPerWeek: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Certification {
  id?: string;
  userId?: string;
  title: string;
  issuer: string;
  year: number;
}

export interface Project {
  id?: string;
  userId?: string;
  title: string;
  description?: string;
  repoUrl?: string;
}
