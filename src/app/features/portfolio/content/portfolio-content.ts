import { InjectionToken } from '@angular/core';
import type {
  PortfolioAcademicEntry,
  PortfolioContactLink,
  PortfolioSkill,
  PortfolioSkillCategory,
} from './portfolio-content.models';

export type PortfolioTranslations = Partial<PortfolioCopy>;

export interface PortfolioCopy {
  eyebrow: string;
  presentationTitle: string;
  intro: string;
  navigation: string;
  aboutTitle: string;
  aboutBody: string;
  experienceTitle: string;
  experienceBody: string;
  experiencePeriodLabel: string;
  experienceContextLabel: string;
  experienceResponsibilitiesLabel: string;
  experienceTechnicalDecisionsLabel: string;
  experienceResultsLabel: string;
  stackTitle: string;
  stackBody: string;
  skillsLanguagesRuntimeLabel: string;
  skillsCorporateIntegrationsLabel: string;
  skillsFrontendLabel: string;
  skillsDevopsObservabilityLabel: string;
  skillsDatabasesLabel: string;
  skillsVersionControlLabel: string;
  educationTitle: string;
  educationBody: string;
  educationDataScience: string;
  educationAppliedStatistics: string;
  educationGraphicDesign: string;
  educationInstitutionLabel: string;
  educationPeriodLabel: string;
  educationCompetenciesLabel: string;
  educationContentLabel: string;
  educationCurrentLabel: string;
  contactTitle: string;
  contactBody: string;
  contactLinkedinLabel: string;
  contactGithubLabel: string;
  contactEmailLabel: string;
  contactPhoneLabel: string;
  contactCurriculumPtLabel: string;
  contactCurriculumEnLabel: string;
  contactCurriculumDownloadLabel: string;
  languageLabel: string;
  resultsTitle: string;
  resultsTimeReductionLabel: string;
  resultsTimeReduction: string;
  resultsStepsReductionLabel: string;
  resultsStepsReduction: string;
  resultsUsersServedLabel: string;
  resultsUsersServed: string;
  resultsProductivityGainLabel: string;
  resultsProductivityGain: string;
  projectsTitle: string;
  professionalProjectsTitle: string;
  personalProjectsTitle: string;
  projectDescriptionLabel: string;
  projectContextLabel: string;
  projectRoleLabel: string;
  projectTechnicalDecisionsLabel: string;
  projectTechnologiesLabel: string;
  projectResultsLabel: string;
  projectLearningsLabel: string;
  projectLinksLabel: string;
}

export type PortfolioSection = 'presentation' | 'about' | 'results';

export const PORTFOLIO_RESULT_KEYS = [
  'resultsTimeReduction',
  'resultsStepsReduction',
  'resultsUsersServed',
  'resultsProductivityGain',
] as const satisfies readonly (keyof PortfolioCopy)[];

const FALLBACK_SKILL_ICON_URLS: Readonly<Record<string, string>> = {
  Java: '/assets/skills/java.png',
  JavaScript: '/assets/skills/javascript.png',
  TypeScript: '/assets/skills/typescript.png',
  'Node.js': '/assets/skills/node-js.png',
  SAP: '/assets/skills/sap.png',
  'REST APIs': '/assets/skills/rest-apis.png',
  Mendix: '/assets/skills/mendix.png',
  React: '/assets/skills/react.png',
  HTML: '/assets/skills/html.png',
  CSS: '/assets/skills/css.png',
  Docker: '/assets/skills/docker.png',
  Grafana: '/assets/skills/grafana.png',
  'SQL Server': '/assets/skills/sql-server.png',
  MySQL: '/assets/skills/mysql.png',
  PostgreSQL: '/assets/skills/postgresql.png',
  MongoDB: '/assets/skills/mongodb.png',
  Git: '/assets/skills/git.png',
  GitHub: '/assets/skills/github.png',
};

export const PORTFOLIO_SKILL_CATEGORIES: readonly PortfolioSkillCategory[] = [
  {
    id: 'languages-runtime',
    labelKey: 'skillsLanguagesRuntimeLabel',
    skills: ['TypeScript', 'Python', 'Java', 'PHP', 'JavaScript', 'Dart'].map(fallbackSkill),
  },
  {
    id: 'corporate-integrations',
    labelKey: 'skillsCorporateIntegrationsLabel',
    skills: ['FastAPI', 'Spring Boot', 'Laravel', 'REST APIs', 'JSF'].map(fallbackSkill),
  },
  {
    id: 'frontend',
    labelKey: 'skillsFrontendLabel',
    skills: ['Angular', 'Flutter', 'HTML', 'CSS', 'React'].map(fallbackSkill),
  },
  {
    id: 'devops-observability',
    labelKey: 'skillsDevopsObservabilityLabel',
    skills: ['Docker', 'Gradle', 'Maven', 'Grafana'].map(fallbackSkill),
  },
  {
    id: 'databases',
    labelKey: 'skillsDatabasesLabel',
    skills: ['PostgreSQL', 'Supabase', 'MySQL', 'Oracle Database'].map(fallbackSkill),
  },
  {
    id: 'version-control',
    labelKey: 'skillsVersionControlLabel',
    skills: ['Git', 'GitHub', 'GitLab', 'GitKraken', 'OpenCV', 'YOLOv8'].map(fallbackSkill),
  },
];

export const PORTFOLIO_ACADEMIC_ENTRIES: readonly PortfolioAcademicEntry[] = [
  {
    id: 'computer-science',
    nameKey: 'educationDataScience',
    institution: 'Instituto Federal de Minas Gerais (IFMG)',
    startDate: '2020-01-20',
    endDate: '2025-08-20',
    isCurrent: false,
    competencies: [
      'Visão Computacional',
      'Inteligência Artificial',
      'Engenharia de Software',
      'Algoritmos e Estruturas de Dados',
      'Redes de Computadores',
      'Bancos de Dados Relacionais',
      'Sistemas Distribuídos',
      'Programação Web e Mobile',
    ],
    studiedContent: [
      'Bacharelado em Ciência da Computação',
      'Trabalho de Conclusão de Curso em Visão Computacional para Análise e Contagem de Golpes em Lutas de Boxe',
      'Projetos de extensão e inovação tecnológica com automação, OCR e desenvolvimento web/mobile',
    ],
    displayOrder: 0,
  },
];

function fallbackSkill(name: string): PortfolioSkill {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    iconUrl: FALLBACK_SKILL_ICON_URLS[name],
  };
}

export const PORTFOLIO_CONTACT_LINKS: readonly PortfolioContactLink[] = [
  {
    id: 'linkedin',
    labelKey: 'contactLinkedinLabel',
    href: 'https://www.linkedin.com/in/xjoaovitordf/',
    symbol: 'linkedin',
    iconPath: '/assets/contact/linkedin.svg',
  },
  {
    id: 'github',
    labelKey: 'contactGithubLabel',
    href: 'https://github.com/joaovitordf',
    symbol: 'github',
    iconPath: '/assets/contact/github.svg',
  },
  {
    id: 'email',
    labelKey: 'contactEmailLabel',
    href: 'mailto:profissional.joaovitordf@gmail.com',
    symbol: 'email',
    iconPath: '/assets/contact/email.svg',
  },
  {
    id: 'phone',
    labelKey: 'contactPhoneLabel',
    href: 'tel:+553799429018',
    symbol: 'phone',
    iconPath: '/assets/contact/phone.svg',
  },
];

export const ORIGINAL_COPY: PortfolioCopy = {
  eyebrow: 'Portfólio profissional',
  presentationTitle: 'Apresentação',
  intro:
    'João Vitor Dias Fernandes é bacharel em Ciência da Computação (IFMG) com atuação em engenharia de software e desenvolvimento web. Possui experiência na construção de sistemas em produção, interfaces em tempo real com vídeo contínuo e telemetria IoT, APIs RESTful, automação e visão computacional.',
  navigation: 'Navegação principal',
  aboutTitle: 'Sobre mim',
  aboutBody:
    'Bacharel em Ciência da Computação pelo Instituto Federal de Minas Gerais (IFMG), com experiência em desenvolvimento de software e aplicações web. Atuei no desenvolvimento de sistemas em produção, plataformas de monitoramento industrial e projetos envolvendo APIs, processamento de dados e visão computacional.',
  experienceTitle: 'Experiências',
  experienceBody: 'Experiências profissionais em engenharia de software e desenvolvimento front-end e fullstack.',
  experiencePeriodLabel: 'Período',
  experienceContextLabel: 'Contexto',
  experienceResponsibilitiesLabel: 'Responsabilidades',
  experienceTechnicalDecisionsLabel: 'Decisões técnicas',
  experienceResultsLabel: 'Resultados',
  stackTitle: 'Habilidades',
  stackBody: 'Tecnologias, linguagens, frameworks e ferramentas aplicadas em projetos e sistemas em produção.',
  skillsLanguagesRuntimeLabel: 'Linguagens e runtime',
  skillsCorporateIntegrationsLabel: 'Backend e APIs',
  skillsFrontendLabel: 'Frontend e Mobile',
  skillsDevopsObservabilityLabel: 'DevOps e ferramentas',
  skillsDatabasesLabel: 'Bancos de dados',
  skillsVersionControlLabel: 'Visão computacional e Versionamento',
  educationTitle: 'Formação acadêmica',
  educationBody: 'Graduação realizada no Instituto Federal de Minas Gerais (IFMG).',
  educationDataScience: 'Ciência da Computação',
  educationAppliedStatistics: 'Estatística Aplicada',
  educationGraphicDesign: 'Design Gráfico',
  educationInstitutionLabel: 'Instituição',
  educationPeriodLabel: 'Período',
  educationCompetenciesLabel: 'Competências desenvolvidas',
  educationContentLabel: 'Conteúdos estudados',
  educationCurrentLabel: 'Em andamento',
  contactTitle: 'Contato',
  contactBody: 'Canais profissionais e currículos.',
  contactLinkedinLabel: 'LinkedIn',
  contactGithubLabel: 'GitHub',
  contactEmailLabel: 'E-mail',
  contactPhoneLabel: 'Telefone',
  contactCurriculumPtLabel: 'Currículo em português',
  contactCurriculumEnLabel: 'Currículo em inglês',
  contactCurriculumDownloadLabel: 'Baixar currículo',
  languageLabel: 'Idioma',
  resultsTitle: 'Resultados profissionais',
  resultsTimeReductionLabel: 'Otimização de carregamento',
  resultsTimeReduction:
    'Redução de 85% no tamanho do pacote inicial de carregamento da aplicação com refatoração modular e lazy loading.',
  resultsStepsReductionLabel: 'Eficiência de processamento',
  resultsStepsReduction:
    'Redução de 83,6% no tempo total de processamento em pipeline de visão computacional.',
  resultsUsersServedLabel: 'Clientes atendidos',
  resultsUsersServed:
    'Plataforma de automação industrial e visão computacional impactando diretamente mais de 50 clientes corporativos.',
  resultsProductivityGainLabel: 'Aceleração de entrega',
  resultsProductivityGain:
    'Redução de 60% no tempo de entrega de novas telas com criação de biblioteca padronizada de componentes reutilizáveis.',
  projectsTitle: 'Projetos',
  professionalProjectsTitle: 'Projetos profissionais',
  personalProjectsTitle: 'Projetos pessoais',
  projectDescriptionLabel: 'Descrição',
  projectContextLabel: 'Contexto',
  projectRoleLabel: 'Papel desempenhado',
  projectTechnicalDecisionsLabel: 'Decisões técnicas',
  projectTechnologiesLabel: 'Tecnologias',
  projectResultsLabel: 'Resultados',
  projectLearningsLabel: 'Aprendizados',
  projectLinksLabel: 'Links relacionados',
};

export type PortfolioCopyKey = keyof PortfolioCopy;

export const PORTFOLIO_EDITABLE_COPY_KEYS = Object.keys(ORIGINAL_COPY) as PortfolioCopyKey[];

export function hasPortfolioSectionContent(
  copy: PortfolioCopy,
  section: PortfolioSection,
): boolean {
  const keys: (keyof PortfolioCopy)[] =
    section === 'presentation'
      ? ['intro']
      : section === 'about'
        ? ['aboutTitle', 'aboutBody']
        : [...PORTFOLIO_RESULT_KEYS];
  return section === 'results'
    ? keys.some((key) => copy[key].trim().length > 0)
    : keys.every((key) => copy[key].trim().length > 0);
}

export function selectPortfolioCopy(
  language: 'pt-BR' | 'en',
  source: () => Partial<PortfolioCopy>,
): PortfolioCopy {
  const copy = { ...ORIGINAL_COPY };
  if (language === 'pt-BR') return copy;
  try {
    const translation = source();
    for (const key of Object.keys(copy) as (keyof PortfolioCopy)[]) {
      try {
        const text = translation[key];
        if (typeof text === 'string' && text.trim()) copy[key] = text;
      } catch {
        // A failed field falls back independently of the remaining content.
      }
    }
  } catch {
    // A failed source keeps the complete original content available.
  }
  return copy;
}
