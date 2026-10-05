import { InjectionToken } from '@angular/core';
import type { PortfolioCopy } from './portfolio-content';

export type PortfolioTranslations = Partial<PortfolioCopy>;

export const ENGLISH_COPY: PortfolioCopy = {
  eyebrow: 'Professional portfolio',
  presentationTitle: 'Presentation',
  intro:
    'João Vitor Dias Fernandes is a Computer Science graduate from IFMG with hands-on experience in software engineering and web application development. Experienced in building production systems, real-time industrial monitoring platforms, and solutions involving APIs, automated data processing, and computer vision.',
  navigation: 'Main navigation',
  aboutTitle: 'About me',
  aboutBody:
    'Computer Science graduate from the Federal Institute of Minas Gerais (IFMG), with hands-on experience in software engineering and web application development. Experienced in building production systems, real-time industrial monitoring platforms, and solutions involving APIs, automated data processing, and computer vision.',
  experienceTitle: 'Experience',
  experienceBody: 'Professional experience in software engineering, frontend and full-stack development.',
  experiencePeriodLabel: 'Period',
  experienceContextLabel: 'Context',
  experienceResponsibilitiesLabel: 'Responsibilities',
  experienceTechnicalDecisionsLabel: 'Technical decisions',
  experienceResultsLabel: 'Results',
  stackTitle: 'Skills',
  stackBody: 'Technologies, languages, frameworks and tools applied in production systems and projects.',
  skillsLanguagesRuntimeLabel: 'Languages and runtime',
  skillsCorporateIntegrationsLabel: 'Backend and APIs',
  skillsFrontendLabel: 'Frontend and Mobile',
  skillsDevopsObservabilityLabel: 'DevOps and tools',
  skillsDatabasesLabel: 'Databases',
  skillsVersionControlLabel: 'Computer Vision and Version Control',
  educationTitle: 'Academic background',
  educationBody: 'Bachelor of Science completed at Federal Institute of Minas Gerais (IFMG).',
  educationDataScience: 'Computer Science',
  educationAppliedStatistics: 'Applied Statistics',
  educationGraphicDesign: 'Graphic Design',
  educationInstitutionLabel: 'Institution',
  educationPeriodLabel: 'Period',
  educationCompetenciesLabel: 'Developed competencies',
  educationContentLabel: 'Studied content',
  educationCurrentLabel: 'In progress',
  contactTitle: 'Contact',
  contactBody: 'Professional channels and resumes.',
  contactLinkedinLabel: 'LinkedIn',
  contactGithubLabel: 'GitHub',
  contactEmailLabel: 'Email',
  contactPhoneLabel: 'Phone',
  contactCurriculumPtLabel: 'Resume in Portuguese',
  contactCurriculumEnLabel: 'Resume in English',
  contactCurriculumDownloadLabel: 'Download resume',
  languageLabel: 'Language',
  resultsTitle: 'Professional results',
  resultsTimeReductionLabel: 'Bundle optimization',
  resultsTimeReduction:
    '85% reduction in initial application bundle size through modular architectural refactoring and lazy loading.',
  resultsStepsReductionLabel: 'Processing efficiency',
  resultsStepsReduction:
    '83.6% reduction in total processing time in a computer vision pipeline.',
  resultsUsersServedLabel: 'Clients served',
  resultsUsersServed:
    'Industrial automation and computer vision platform directly impacting 50+ enterprise clients.',
  resultsProductivityGainLabel: 'Delivery acceleration',
  resultsProductivityGain:
    '60% reduction in development time for new screens by creating an internal reusable component library.',
  projectsTitle: 'Projects',
  professionalProjectsTitle: 'Professional projects',
  personalProjectsTitle: 'Personal projects',
  projectDescriptionLabel: 'Description',
  projectContextLabel: 'Context',
  projectRoleLabel: 'Role',
  projectTechnicalDecisionsLabel: 'Technical decisions',
  projectTechnologiesLabel: 'Technologies',
  projectResultsLabel: 'Results',
  projectLearningsLabel: 'Learnings',
  projectLinksLabel: 'Related links',
};

export const TRANSLATION_SOURCE = new InjectionToken<() => PortfolioTranslations>(
  'Portfolio translations',
  {
    providedIn: 'root',
    factory: () => () => ENGLISH_COPY,
  },
);
