import { ServiceDetail, QuizQuestion } from './types';

export const SERVICES_DATA: ServiceDetail[] = [
  {
    id: 'cloud',
    title: 'Computação em Nuvem',
    description: 'Migração, gerenciamento e otimização de ambientes AWS, Azure e Google Cloud com foco em escalabilidade.',
    longDescription: 'Nossos arquitetos de nuvem certificados desenham e migram infraestruturas robustas utilizando metodologias de ponta. Automatize processos de deploys, garanta escalabilidade elástica sob demanda e reduza a pegada de custos operacionais com arquiteturas serverless avançadas.',
    icon: 'CloudDone',
    bullets: [
      'Arquitetura Serverless de alta performance',
      'Monitoramento 24/7 com inteligência preditiva',
      'Migrações complexas com zero downtime',
      'FinOps: otimização contínua de custos de nuvem'
    ],
    techStack: ['AWS', 'Google Cloud', 'Microsoft Azure', 'Terraform', 'Kubernetes'],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhQhfIwH8yhfCRRzDfpE0N7UoscyIWSMP-GoPmHChg66UJg5EBd4FsWeVNO8U908oY7whZBaD-0izCCqg-pROWEYZ3tC--6DyjJNJzewg8Ofaj2BFFtk5ZlghFRjQATAOi4RY08w-Yrh7eJnDMffz6BpkVChdEF0QjvubolzY0nPKg8GoSmM7yyUHNAh5zRSRLM8io8f6J0RLNnW7MQ3eTiUQiGnI6tYLdJCoZMLJni3R11xsCur8xp28HcIXbjT1fhRDUB29MA-b9'
  },
  {
    id: 'security',
    title: 'Cibersegurança Avançada',
    description: 'Proteção multicamada contra ameaças digitais, ataques DDoS e Ransomware.',
    longDescription: 'No cenário moderno de ameaças, uma brecha de segurança pode custar a reputação de um negócio. Oferecemos segurança baseada nos princípios de Zero Trust, realizando pentests profundos, auditorias de conformidade (LGPD) e monitoramento SOC proativo.',
    icon: 'Shield',
    bullets: [
      'Análises de vulnerabilidade estrutural e Pentest',
      'Monitoramento de firewall robusto e endpoints',
      'Planos de Resposta a Incidentes de segurança',
      'Conformidade técnica integral com a LGPD e ISO 27001'
    ],
    techStack: ['Zero Trust', 'SOC 24/7', 'SIEM / SOAR', 'LGPD Compliance', 'Next-Gen Firewall'],
    imageUrl: ''
  },
  {
    id: 'support',
    title: 'Suporte Gerenciado',
    description: 'Equipe técnica dedicada atuando proativamente para garantir zero downtime na sua operação.',
    longDescription: 'Esqueça os chamados que demoram dias. Nosso modelo de suporte gerenciado se baseia em prevenção proativa e SLAs rigorosos de resposta. Monitoramos os servidores, links e dispositivos da sua operação para corrigir problemas antes que eles afetem seus olhos.',
    icon: 'SupportAgent',
    bullets: [
      'SLA de resposta para chamados críticos de até 15 minutos',
      'Manutenções preventivas programadas regulares',
      'Suporte técnico N1, N2 e N3 com especialistas dedicados',
      'Inventário inteligente de hardware e software'
    ],
    // Single-strand fiber optics image URL from provided html
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgya7W2A6MTbdWtOYiZJvy0svPKcDaxAK5SmwGr-iVHY1XLfX9NDI5OTUH2hC3OiQHCQygkDJm9s1EjDo_hMa2tEZ98Hx6xebsCsnZSOjh6ejeBF6rk88a0jB0m3yHhJecpAlOSa8p9IXqiS5z7E6sY_atMct8tQNonZFsNjVWSDOQL86EJdL19bVj61LNtpd2ksxNibyuhCpTwvznF1OGgsrY0wEELowosGfBBboEOGXLKCMVOqmZAC4ecfeb6pNlaxYcx_5XrraK'
  },
  {
    id: 'development',
    title: 'Desenvolvimento de Software',
    description: 'Sistemas customizados, APIs robustas e aplicações web de alta performance para o seu modelo de negócio.',
    longDescription: 'Desenvolvemos códigos limpos, escaláveis e focados na melhor experiência de uso possível. Desde microserviços em nuvem até portais empresariais integrados, desenhamos a solução perfeita sob medida para escalar com a sua demanda comercial.',
    icon: 'Terminal',
    bullets: [
      'Desenvolvimento ágil com entregas de valor contínuas',
      'Integrações seguras com terceiros via APIs restfull',
      'Arquiteturas modernas prontas para escalabilidade elástica',
      'Garantia de qualidade ativa com cobertura ampla de testes'
    ],
    techStack: ['React/Next.js', 'Node.js', 'Python', 'Go', 'PostgreSQL', 'Docker']
  }
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    category: 'MFA & Acessos',
    text: 'Como é administrada a segurança de acessos e senhas na sua empresa?',
    options: [
      {
        text: 'Temos Autenticação de Dois Fatores (MFA) em 100% das nossas contas e sistemas corporativos.',
        score: 0,
        feedback: 'Excelente! O MFA barra até 99.9% dos ataques modernos de comprometimento de credenciais.'
      },
      {
        text: 'Temos MFA ativo apenas nos e-mails corporativos, mas outros sistemas não utilizam.',
        score: 5,
        feedback: 'Atenção: Sistemas auxiliares desprotegidos são portas de entrada silenciosas para invasores.'
      },
      {
        text: 'Não utilizamos MFA ou as senhas são genéricas e compartilhadas.',
        score: 10,
        feedback: 'Risco Crítico! A falta de MFA facilita enormemente comprometimentos de rede e sequestro de acessos.'
      }
    ]
  },
  {
    id: 2,
    category: 'Backups & Recuperação',
    text: 'Qual é a política de backups de dados críticos do seu negócio?',
    options: [
      {
        text: 'Backups diários automáticos, descentralizados e testados com frequência.',
        score: 0,
        feedback: 'Sensacional! Ter backups imutáveis e testados protege totalmente seu negócio contra Ransomwares.'
      },
      {
        text: 'Fazemos backups semanais ou mensais de forma manual, mas não temos testes de restauração freqüentes.',
        score: 5,
        feedback: 'Médio Risco: Sem testes contínuos de restauração, backups podem falhar ou estar corrompidos na hora da crise.'
      },
      {
        text: 'Não temos uma rotina definida de backups ou raramente salvamos cópias.',
        score: 10,
        feedback: 'Risco Estrutural! Perda catastrófica de dados pode fechar as operações de um negócio de forma imediata.'
      }
    ]
  },
  {
    id: 3,
    category: 'Cultura de Segurança',
    text: 'Como está o nível de conscientização em segurança da sua equipe?',
    options: [
      {
        text: 'Treinamentos anuais contra Phishing e simulações regulares com toda equipe.',
        score: 0,
        feedback: 'Parabéns! O elo humano é o mais atacado; manter o time consciente blinda o canal operacional.'
      },
      {
        text: 'Explicamos os termos básicos de segurança no processo de contratação, mas sem reciclar.',
        score: 5,
        feedback: 'Risco Moderado: Mudanças rápidas em técnicas hacker tornam treinamentos antigos rapidamente defasados.'
      },
      {
        text: 'Não há políticas de treinamento de segurança; o pessoal desconhece os golpes modernos.',
        score: 10,
        feedback: 'Altíssimo Risco! Um único clique inocente em um e-mail de phishing pode conceder acesso de admin à rede.'
      }
    ]
  },
  {
    id: 4,
    category: 'Infraestrutura & Atualizações',
    text: 'Como é feito o monitoramento de rede e atualização de softwares?',
    options: [
      {
        text: 'Monitoramento contínuo e atualizações de segurança críticas instaladas imediatamente ou em até 24h.',
        score: 0,
        feedback: 'Perfeito! Aplicação ágil de patches evita que vulnerabilidades conhecidas sejam exploradas por criminosos.'
      },
      {
        text: 'Atualizamos quando o sistema notifica ou de forma manual a cada poucos meses.',
        score: 5,
        feedback: 'Risco Exposto: Sistemas desatualizados por semanas acumulam brechas frequentemente mineradas por malwares.'
      },
      {
        text: 'Não possuímos monitoramento de rede e temos softwares sem atualizações há anos.',
        score: 10,
        feedback: 'Vulnerabilidade Crítica! Invasors usam scanners automatizados na internet buscando especificamente suas portas abertas.'
      }
    ]
  }
];

export const TESTIMONIALS_DATA = [
  {
    name: 'Mariana Silva',
    role: 'CTO, Fintech Solutions',
    quote: 'A Viatix transformou nossa infraestrutura legada em um ecossistema ágil. A redução de custos superou nossas expectativas em apenas 6 meses.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBA96YYY_bS0AxP3ZPkzkUS5P5Ju6PTDVzakOW5l0wHMk2IXsNL4a8_-oJFQzRzk_xeHHzEyjOJ389jN_5-LewR_ApyhU-4Dl3nchtbCe_Xjv3Mm1a-Is7w9y3hs3nbaPY4yhyn0uQSCGdaM_13rEug2pyoeQB00-MlnYgnESu0VXPAyPug0zVG_xFsujIljf--M0UljjDlk7SM2VSboDAk6l8rbgAO2edpm4qWtRjPhIOsxd4zqpXAF-7IdFBbl6CLuyQ9l-Tx-Tso'
  },
  {
    name: 'Ricardo Mendes',
    role: 'Diretor de Operações, Global Log',
    quote: 'O suporte 24/7 deles não é apenas um slogan. Em momentos críticos, a resposta foi imediata e precisa. Parceiro estratégico essencial.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmp5T87QhmIJ_bX9tF5xZsMVl61bzIODVrGVT3YR-QYXJvIwb2woq-QTn7hN8oNZQ2h15WkGjp6rE8-UoVs3tY01JODtP0svSwu4LqQS2HwTtx9o4Th1gWVMA2tiUDBsqa2OMiX9H0G8TV0y5dk675azfejj6oG5Q9AeVIA6x4GBIZ6SsR7He7MfAq06twuVErZq-6-EveVLLTb_6qZ6Wl0_kmdzPQq7pwff-iQAnkpReaLItbyQRpzAWOW5Znbz_x3rbunqPKNiWT'
  }
];
