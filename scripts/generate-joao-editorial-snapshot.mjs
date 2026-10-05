import { createHash } from 'node:crypto';
import { stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  ORIGINAL_COPY,
  PORTFOLIO_SKILL_CATEGORIES,
  PORTFOLIO_ACADEMIC_ENTRIES,
  PORTFOLIO_CONTACT_LINKS,
} from '../src/app/features/portfolio/content/portfolio-content.ts';
import { ENGLISH_COPY } from '../src/app/features/portfolio/content/portfolio-translations.ts';

const FALLBACK_SKILL_ICON_URLS = {
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

const root = resolve(import.meta.dirname, '..');
const outputPath = resolve(
  root,
  'spec/05-verificacao/ativacao-painel-admin-joao-vitor/initial-editorial-snapshot-joao-v1.json',
);

const entities = {};
const translations = { 'pt-BR': {}, en: {} };
const technologies = {};
const media = {};

const normalizeTechnology = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+\d.*$/, '');

const technologyIds = new Map();
for (const category of PORTFOLIO_SKILL_CATEGORIES) {
  for (const skill of category.skills) {
    technologyIds.set(normalizeTechnology(skill.name), skill.id);
  }
}

function technologyId(label) {
  const normalized = normalizeTechnology(label);
  const existing = technologyIds.get(normalized);
  if (existing) {
    const aliases = new Set(technologies[existing]?.aliases ?? []);
    if (label !== technologies[existing]?.label) aliases.add(label);
    technologies[existing] ??= { label: label.replace(/\s+\d.*$/, ''), aliases: [] };
    technologies[existing].aliases = [...aliases];
    return existing;
  }
  const id = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  technologyIds.set(normalized, id);
  technologies[id] = { label, aliases: [] };
  return id;
}

function add(id, kind, position, data, pt, en = pt, parentId) {
  entities[id] = { kind, ...(parentId ? { parentId } : {}), position, data };
  translations['pt-BR'][id] = pt;
  translations.en[id] = en;
}

function addLists(parentId, groups, englishGroups = {}) {
  let position = 0;
  for (const [collection, values] of Object.entries(groups)) {
    const english = englishGroups[collection] ?? values;
    values.forEach((text, index) =>
      add(
        `${parentId}-${collection}-${index + 1}`,
        'listItem',
        position++,
        { collection },
        { text },
        { text: english[index] ?? text },
        parentId,
      ),
    );
  }
}

// 1. Interface copy texts
Object.keys(ORIGINAL_COPY).forEach((key, position) =>
  add(
    `copy-${key}`,
    'interfaceText',
    position,
    { key },
    { text: ORIGINAL_COPY[key] },
    { text: ENGLISH_COPY[key] ?? ORIGINAL_COPY[key] },
  ),
);

// 2. Experiências de João Vitor
const joaoExperiences = [
  {
    id: '8a1135e2-b735-438b-a819-381511b94840',
    startDate: '2025-09-01',
    endDate: '2026-09-01',
    pt: {
      title: 'Desenvolvedor Front-end · SensorEng',
      context:
        'Atuação remota em equipe ágil em plataforma de automação industrial e visão computacional na SensorEng, impactando diretamente mais de 50 clientes corporativos.',
      responsibilities: [
        'Liderei a refatoração arquitetural de um monólito legado para uma estrutura modular, implementando carregamento sob demanda e reduzindo em 85% o tamanho do pacote inicial de carregamento da aplicação.',
        'Desenvolvi e evoluí interfaces para monitoramento industrial em tempo real, integrando transmissão de vídeo contínua, inferências de modelos de Inteligência Artificial e telemetria de sensores IoT com mapas georreferenciados.',
        'Criei uma biblioteca interna com componentes reutilizáveis (tabelas dinâmicas, filtros e modais) aplicados em todo o sistema, padronizando a interface de usuário e acelerando em 60% a entrega de novas telas.',
        'Implementei controle de níveis de permissão por perfil de usuário com proteção de rotas e autenticação, assegurando o isolamento seguro de dados entre múltiplas empresas clientes.',
      ],
      technicalDecisions: [
        'Arquitetura modular em Angular com lazy loading de rotas.',
        'Integração de WebSockets e streaming de vídeo de baixa latência.',
        'Controle de acesso baseado em papéis (RBAC) com Route Guards.',
      ],
      results: [
        'Redução de 85% no tamanho do pacote inicial de carregamento da aplicação com refatoração modular e lazy loading.',
        'Redução de 60% no tempo de entrega de novas telas com criação de biblioteca padronizada de componentes reutilizáveis.',
        'Plataforma de automação industrial e visão computacional impactando diretamente mais de 50 clientes corporativos.',
      ],
    },
    en: {
      title: 'Frontend Developer · SensorEng',
      context:
        'Remote agile software development at SensorEng in an industrial automation and computer vision platform directly serving over 50 enterprise clients.',
      responsibilities: [
        'Led architectural refactoring from a legacy monolith to a modular codebase with lazy loading, reducing the initial bundle size by 85%.',
        'Built real-time industrial monitoring interfaces integrating live video feeds, AI inference overlays, and IoT sensor telemetry over interactive maps.',
        'Authored an internal reusable UI component library (dynamic data tables, filters, modals), standardizing UI patterns and accelerating feature delivery by 60%.',
        'Designed role-based access control (RBAC) with route guards and authentication token policies, enforcing multi-tenant data isolation.',
      ],
      technicalDecisions: [
        'Modular Angular architecture with route-level lazy loading.',
        'WebSocket telemetry streaming and low-latency video feeds.',
        'Role-based access control (RBAC) using Angular route guards.',
      ],
      results: [
        '85% reduction in initial application bundle size through modular refactoring and lazy loading.',
        '60% reduction in development time for new screens via reusable component library.',
        'Platform directly impacting 50+ enterprise clients.',
      ],
    },
  },
  {
    id: '147c2bd9-9ca4-4155-b6ab-8bf4dcf6c9a9',
    startDate: '2024-08-01',
    endDate: '2025-01-01',
    pt: {
      title: 'Desenvolvedor Júnior Fullstack · Avante Sistemas',
      context:
        'Atuação presencial na Avante Sistemas em Formiga (MG), contribuindo para sistemas de gestão empresarial utilizados por diferentes segmentos de negócio.',
      responsibilities: [
        'Desenvolvi e mantive funcionalidades em sistemas ERP voltados à gestão empresarial, contribuindo para a evolução dos módulos e processos do sistema.',
        'Analisei e corrigi problemas no código e no banco de dados, realizando consultas e ajustes para manutenção e estabilidade dos sistemas.',
        'Contribuí para a implementação de novas funcionalidades e adequações dos sistemas às necessidades dos diferentes setores da empresa.',
      ],
      technicalDecisions: [
        'Otimização de queries relacionais e índices no banco de dados.',
        'Modularização de rotinas de processamento de regras de negócio.',
      ],
      results: [
        'Maior estabilidade operacional e redução de falhas em relatórios e rotinas críticas.',
      ],
    },
    en: {
      title: 'Junior Full-Stack Developer · Avante Sistemas',
      context:
        'On-site position at Avante Sistemas in Formiga, MG, building enterprise management solutions across diverse business segments.',
      responsibilities: [
        'Developed and maintained features for Enterprise Resource Planning (ERP) software, supporting the evolution of business management modules and workflows.',
        'Diagnosed and resolved code and database defects, optimizing SQL queries and applying fixes to improve system stability and reliability.',
        'Contributed to implementing new features and tailoring software capabilities to the operational needs of various company departments.',
      ],
      technicalDecisions: [
        'SQL query optimization and database schema refinements.',
        'Business process module enhancements.',
      ],
      results: ['Improved system reliability and data processing accuracy.'],
    },
  },
  {
    id: '5ab9dd44-8d76-4490-a254-d7bd01029e37',
    startDate: '2024-03-01',
    endDate: '2025-03-01',
    pt: {
      title: 'Estagiário de Engenharia de Software',
      context:
        'Atuação híbrida como aluno bolsista em projeto de extensão no Polo de Inovação do Instituto Federal de Minas Gerais em parceria com o setor privado, desenvolvendo uma plataforma web para automação e concessão de crédito comercial.',
      responsibilities: [
        'Desenvolvi serviços de leitura e extração automatizada de dados em documentos usando Visão Computacional e OCR, permitindo o reconhecimento e a classificação de mais de 20 tipos de arquivos (como contratos sociais, demonstrativos financeiros, CNH e documentos veiculares).',
        'Contribuí para a integração entre os diferentes componentes da aplicação e para a manutenção dos serviços existentes.',
      ],
      technicalDecisions: [
        'Pipelines de OCR para extração e estruturação automatizada de dados.',
        'Classificação supervisionada de tipos de documentos comerciais.',
      ],
      results: ['Automação do fluxo de concessão e validação de documentos de crédito.'],
    },
    en: {
      title: 'Software Engineering Intern',
      context:
        'Hybrid role as a scholarship research intern in an extension project at the IFMG Innovation Hub in partnership with the private sector, developing a web platform for commercial credit automation and approval.',
      responsibilities: [
        'Developed automated document parsing and data extraction services using Computer Vision and OCR, enabling automatic identification and classification of over 20 document types (including articles of association, financial statements, driver’s licenses, and vehicle registrations).',
        'Contributed to integrating application components and maintaining existing services.',
      ],
      technicalDecisions: [
        'OCR automated extraction pipelines and dynamic parsing.',
        'Classification of financial and identity documents.',
      ],
      results: ['Streamlined approval workflows and eliminated manual document entry.'],
    },
  },
  {
    id: 'c2250aa4-f25d-4ad2-9e8d-41a8c0d08bfb',
    startDate: '2023-05-01',
    endDate: '2023-10-01',
    pt: {
      title: 'Estagiário de Engenharia de Software',
      context:
        'Atuação no Polo de Inovação do Instituto Federal de Minas Gerais, desenvolvendo um aplicativo de celular para controle de jornada e frequência dos servidores e colaboradores do campus.',
      responsibilities: [
        'Desenvolvi uma aplicação mobile multiplataforma integrada ao SUAP, implementando injeção de scripts para autenticação automatizada e registro de ponto.',
        'Implementei rotinas de web scraping em tempo real para extração e renderização simplificada do histórico de presença do dia (entradas e saídas), mitigando divergências na conferência de frequência.',
        'Estruturei armazenamento local de credenciais e módulo de agendamento de lembretes com alarmes sonoros, além de validação de conectividade via Wi-Fi institucional para garantir conformidade no registro.',
      ],
      technicalDecisions: [
        'Aplicação móvel multiplataforma com armazenamento seguro de credenciais.',
        'Web scraping integrado ao SUAP para sincronização instantânea de frequência.',
        'Validação de rede Wi-Fi institucional para auditoria de presença.',
      ],
      results: [
        'Mitigação de divergências em registros de ponto e maior pontualidade institucional.',
      ],
    },
    en: {
      title: 'Software Engineering Intern',
      context:
        'Work at the IFMG Innovation Hub, developing a mobile application for daily work hours and attendance tracking for campus faculty and staff.',
      responsibilities: [
        'Developed a cross-platform mobile application integrated with SUAP, implementing script injection for automated authentication and time-clock registration.',
        'Built real-time web scraping routines to retrieve and display daily attendance history (clock-in/clock-out events), reducing discrepancies in attendance records.',
        'Implemented secure local credential storage, a notification scheduling module with audio reminders, and institutional Wi-Fi validation to ensure valid attendance registration.',
      ],
      technicalDecisions: [
        'Cross-platform mobile client with secure local credential storage.',
        'Real-time automated web scraping routines.',
        'Institutional network boundary validation.',
      ],
      results: ['Eliminated punch discrepancies and automated administrative compliance.'],
    },
  },
];

joaoExperiences.forEach((row, position) => {
  add(
    row.id,
    'experience',
    position,
    { startDate: row.startDate, endDate: row.endDate },
    { title: row.pt.title, context: row.pt.context },
    { title: row.en.title, context: row.en.context },
  );
  addLists(
    row.id,
    {
      responsibilities: row.pt.responsibilities,
      technicalDecisions: row.pt.technicalDecisions,
      results: row.pt.results,
    },
    {
      responsibilities: row.en.responsibilities,
      technicalDecisions: row.en.technicalDecisions,
      results: row.en.results,
    },
  );
});

// 3. Projetos de João Vitor
const joaoProjects = [
  {
    id: '5b468d55-a913-465e-a69a-a052348efd26',
    projectType: 'personal',
    technologies: ['Angular', 'TypeScript', 'Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
    links: [{ label: 'GitHub', href: 'https://github.com/joaovitordf' }],
    pt: {
      name: 'Russian Mastery',
      description:
        'Plataforma full-stack para aprendizado do idioma russo com repetição espaçada SM-2, simulador de teclado cirílico e sistema de gamificação.',
      problemContext:
        'O aprendizado de idiomas com alfabetos distintos exige retenção duradoura de vocabulário, treino de digitação e acompanhamento contínuo de revisões.',
      solution:
        'Plataforma completa com front-end reativo, teclado cirílico interativo em tela, exercícios dinâmicos, gamificação com XP/níveis e API RESTful rápida.',
      role: 'Arquiteto e Desenvolvedor Full-Stack do projeto.',
      technicalDecisions: [
        'Implementação do algoritmo de repetição espaçada SM-2 (SuperMemo-2).',
        'API RESTful em FastAPI com cache Redis para otimização de consultas da base de +43.000 palavras.',
        'Autenticação JWT, controle de acesso RBAC e conteinerização completa com Docker.',
      ],
      results: [
        'Base de dados com mais de 43.000 palavras e sentenças catalogadas.',
        'Simulador de digitação cirílica interativo com reprodução de pronúncia.',
      ],
      learnings: [
        'Domínio de algoritmos de repetição espaçada para retenção de memória.',
        'Arquitetura de cache multi-nível em Redis com persistência PostgreSQL.',
      ],
    },
    en: {
      name: 'Russian Mastery',
      description:
        'Full-stack Russian language learning platform featuring SuperMemo-2 (SM-2) spaced repetition, on-screen Cyrillic keyboard simulator, and gamification.',
      problemContext:
        'Learning a language with a distinct alphabet requires dynamic spaced recall, Cyrillic typing muscle memory, and structured progression.',
      solution:
        'Full-stack web application with responsive UI, gamified practice sessions with XP and leveling, and an asynchronous backend.',
      role: 'Full-Stack Architect and Developer.',
      technicalDecisions: [
        'SuperMemo-2 (SM-2) algorithm implementation for spaced interval calculations.',
        'FastAPI RESTful service integrated with Redis caching for 43,000+ words database.',
        'JWT authentication, RBAC, and full Docker containerization.',
      ],
      results: [
        'Database of 43,000+ words and contextual sentences.',
        'Interactive Cyrillic keyboard simulator with audio pronunciation support.',
      ],
      learnings: [
        'Spaced repetition algorithms and dynamic memory scheduling.',
        'High-throughput Redis cache design paired with relational persistence.',
      ],
    },
  },
  {
    id: '3f6fa6a5-f038-4ae5-a186-42a376465892',
    projectType: 'personal',
    technologies: ['Python', 'OpenCV', 'YOLOv8', 'MediaPipe', 'Flutter', 'REST APIs'],
    links: [{ label: 'GitHub', href: 'https://github.com/joaovitordf' }],
    pt: {
      name: 'Pipeline de Visão Computacional para Boxe',
      description:
        'Pipeline de visão computacional em tempo real para estimativa de pose, rastreamento de atletas e contagem automatizada de golpes em lutas de boxe (TCC).',
      problemContext:
        'A análise esportiva e a arbitragem em esportes de combate exigem detecção precisa de golpes em alta velocidade sem interferência de oclusões e movimentação rápida.',
      solution:
        'Pipeline que combina estimativa de pose com modelos YOLO fine-tuned, ROIs dinâmicas, máquina de estados finitos (FSM) para validação de golpes e streaming via celular.',
      role: 'Pesquisador e Desenvolvedor (Trabalho de Conclusão de Curso em Ciência da Computação - IFMG).',
      technicalDecisions: [
        'Treinamento e fine-tuning de modelos YOLO em dataset customizado.',
        'Segmentação geométrica com ROIs dinâmicas para o corpo dos atletas, reduzindo em 83,6% o tempo total de processamento.',
        'Autômato de estados finitos (FSM) para contagem de golpes válidos e identificação de faltas.',
        'Integração de app mobile com servidor assíncrono para streaming de vídeo ao vivo.',
      ],
      results: [
        'Redução de 83,6% no tempo de processamento comparado à abordagem de clusterização.',
        'Detecção e contagem automatizada de golpes com alta acurácia.',
      ],
      learnings: [
        'Otimização de inferência de redes neurais para visão computacional em tempo real.',
        'Modelagem de máquinas de estados aplicadas a eventos esportivos complexos.',
      ],
    },
    en: {
      name: 'Computer Vision Pipeline for Boxing Matches',
      description:
        'Real-time computer vision pipeline for human pose estimation, athlete tracking, and automated strike counting in boxing matches (Bachelor Thesis).',
      problemContext:
        'Combat sports analytics and judging require accurate real-time detection of high-velocity strikes without failing under occlusion.',
      solution:
        'Computer vision pipeline integrating custom-trained YOLO models, dynamic ROIs, finite-state machine (FSM) strike validation, and live streaming.',
      role: 'Researcher and Developer (Bachelor Thesis in Computer Science - IFMG).',
      technicalDecisions: [
        'Custom YOLO model training and fine-tuning on annotated boxing footage.',
        'Geometric segmentation with dynamic ROIs, reducing total processing time by 83.6%.',
        'Finite-state machine (FSM) to classify and count valid strikes and fouls.',
        'Asynchronous backend server streaming live video from a mobile device.',
      ],
      results: [
        '83.6% reduction in total pipeline processing time.',
        'Reliable strike classification and automated count verification.',
      ],
      learnings: [
        'Real-time neural network inference optimizations for high-FPS video.',
        'State machine modeling for complex kinetic sports events.',
      ],
    },
  },
];

joaoProjects.forEach((row, position) => {
  add(
    row.id,
    'project',
    position,
    { type: row.projectType, technologyIds: row.technologies.map(technologyId) },
    {
      name: row.pt.name,
      description: row.pt.description,
      problemContext: row.pt.problemContext,
      solution: row.pt.solution,
      role: row.pt.role,
    },
    {
      name: row.en.name,
      description: row.en.description,
      problemContext: row.en.problemContext,
      solution: row.en.solution,
      role: row.en.role,
    },
  );
  addLists(
    row.id,
    {
      technicalDecisions: row.pt.technicalDecisions,
      results: row.pt.results,
      learnings: row.pt.learnings,
    },
    {
      technicalDecisions: row.en.technicalDecisions,
      results: row.en.results,
      learnings: row.en.learnings,
    },
  );
  row.links.forEach((link, index) =>
    add(
      `${row.id}-link-${index + 1}`,
      'projectLink',
      index,
      { href: link.href },
      { label: link.label },
      { label: link.label },
      row.id,
    ),
  );
});

// 4. Skills e Categorias de João Vitor
for (const [categoryPosition, category] of PORTFOLIO_SKILL_CATEGORIES.entries()) {
  add(
    category.id,
    'skillCategory',
    categoryPosition,
    {},
    { label: ORIGINAL_COPY[category.labelKey] },
    { label: ENGLISH_COPY[category.labelKey] },
  );
  for (const [position, skill] of category.skills.entries()) {
    const iconUrl = FALLBACK_SKILL_ICON_URLS[skill.name];
    const mediaId = iconUrl ? `asset-${skill.id}` : undefined;
    add(
      `skill-${skill.id}`,
      'skill',
      position,
      { technologyId: skill.id, ...(mediaId ? { iconMediaId: mediaId } : {}) },
      { name: skill.name },
      { name: skill.name },
      category.id,
    );
    const existingTechnology = technologies[skill.id];
    technologies[skill.id] = {
      label: skill.name,
      ...(mediaId ? { iconMediaId: mediaId } : {}),
      aliases: existingTechnology?.aliases ?? [],
    };
    if (mediaId && !media[mediaId]) {
      let bytes = 1000;
      try {
        const filePath = resolve(root, 'src', iconUrl.replace(/^\//, ''));
        const s = await stat(filePath);
        bytes = s.size;
      } catch {
        // use fallback bytes
      }
      media[mediaId] = {
        source: 'bundled',
        mime: 'image/png',
        bytes,
        assetPath: iconUrl,
      };
    }
  }
}

// 5. Formação Acadêmica
PORTFOLIO_ACADEMIC_ENTRIES.forEach((item, position) => {
  add(
    item.id,
    'academic',
    position,
    { startDate: item.startDate, endDate: item.endDate, isCurrent: item.isCurrent },
    { name: ORIGINAL_COPY[item.nameKey], institution: item.institution },
    { name: ENGLISH_COPY[item.nameKey], institution: item.institution },
  );
  addLists(item.id, { competencies: item.competencies, studiedContent: item.studiedContent });
});

// 6. Contatos
PORTFOLIO_CONTACT_LINKS.forEach((item, position) =>
  add(
    item.id,
    'contact',
    position,
    { symbol: item.symbol, href: item.href },
    { label: ORIGINAL_COPY[item.labelKey] },
    { label: ENGLISH_COPY[item.labelKey] },
  ),
);

const snapshot = {
  formatVersion: 1,
  publicationId: '00000000-0000-4000-8000-000000000001',
  createdAt: '2026-10-05T12:00:00.000Z',
  defaultLocale: 'pt-BR',
  locales: [
    { code: 'pt-BR', label: 'Português', direction: 'ltr', position: 0 },
    { code: 'en', label: 'English', direction: 'ltr', position: 1 },
  ],
  sections: [
    'presentation',
    'about',
    'results',
    'experiences',
    'projects',
    'skills',
    'education',
    'contact',
  ].map((kind, position) => ({ id: `${kind}-section`, kind, position })),
  entities,
  translations,
  technologies,
  media,
};

await writeFile(outputPath, JSON.stringify(snapshot, null, 2) + '\n');
console.log('Snapshot generated successfully at:', outputPath);
console.log(
  JSON.stringify({
    entities: Object.keys(entities).length,
    technologies: Object.keys(technologies).length,
    media: Object.keys(media).length,
  }),
);
