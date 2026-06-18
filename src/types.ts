export interface ContactSubmission {
  id: string;
  fullName: string;
  email: string;
  service: string;
  message: string;
  timestamp: string;
  status: 'Pendente' | 'Análise Iniciada' | 'Agendado';
}

export interface QuizQuestion {
  id: number;
  text: string;
  category: string;
  options: {
    text: string;
    score: number; // 0 = low risk, 5 = medium, 10 = high risk
    feedback: string;
  }[];
}

export interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  bullets: string[];
  techStack?: string[];
  imageUrl?: string;
  meta?: string;
}

export interface CRMLead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  stage: 'Novo' | 'Contato' | 'Proposta' | 'Ganho' | 'Perdido';
  service: string;
  notes: string;
  updatedAt: string;
}

export interface CRMTask {
  id: string;
  leadId?: string;
  description: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

