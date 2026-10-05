import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PortfolioPage } from './portfolio-page';
import {
  BROWSER_LANGUAGE,
  PortfolioLanguageService,
} from '../../content/portfolio-language.service';
import { TRANSLATION_SOURCE } from '../../content/portfolio-translations';
import { ORIGINAL_COPY, type PortfolioCopy } from '../../content/portfolio-content';
import { PortfolioContentService } from '../../content/portfolio-content.service';
import type {
  PortfolioExperience,
  PortfolioFile,
  PortfolioProject,
} from '../../content/portfolio-content.models';
import { ENGLISH_COPY } from '../../content/portfolio-translations';

let experienceRows: PortfolioExperience[] = [];
let projectRows: PortfolioProject[] = [];
let curriculumRows: Partial<Record<'pt-BR' | 'en', PortfolioFile | null>> = {};
const editorialOrder = signal<string[]>([]);

describe('PortfolioPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    experienceRows = createExperiences('pt-BR');
    projectRows = [];
    curriculumRows = {};
    editorialOrder.set([]);
    const contentService = {
      remoteCopy: signal<Partial<PortfolioCopy>>({}),
      editorialSectionOrder: editorialOrder,
      loadCopy: vi.fn(async () => ({})),
      listExperiences: vi.fn(async (locale: 'pt-BR' | 'en') =>
        experienceRows.length > 0 ? createExperiences(locale) : [],
      ),
      listProjects: vi.fn(async (locale: 'pt-BR' | 'en') =>
        projectRows.map((project) => ({
          ...project,
          locale,
          name: locale === 'en' ? 'English ' + project.name : project.name,
          description: locale === 'en' ? 'English description' : project.description,
          problemContext: locale === 'en' ? 'English context' : project.problemContext,
          role: locale === 'en' ? 'English role' : project.role,
          technicalDecisions: locale === 'en' ? ['English decision'] : project.technicalDecisions,
          technologies: locale === 'en' ? ['English technology'] : project.technologies,
          results: locale === 'en' ? ['English result'] : project.results,
          learnings: locale === 'en' ? ['English learning'] : project.learnings,
        })),
      ),
      getCurriculum: vi.fn(async (locale: 'pt-BR' | 'en') => curriculumRows[locale] ?? null),
    };
    await TestBed.configureTestingModule({
      imports: [PortfolioPage],
      providers: [
        { provide: BROWSER_LANGUAGE, useValue: () => 'pt-BR' },
        { provide: PortfolioContentService, useValue: contentService },
      ],
    }).compileComponents();
  });

  async function render() {
    const fixture = TestBed.createComponent(PortfolioPage);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('renders the presentation, about, results, and existing sections with stable navigation targets', async () => {
    const { fixture, element } = await render();
    const sections = [...element.querySelectorAll('section')];
    for (const language of ['en', 'pt-BR'] as const) {
      TestBed.inject(PortfolioLanguageService).choose(language);
      await fixture.whenStable();
      expect(element.querySelector('#apresentacao')).toBeTruthy();
      for (const id of ['sobre-mim', 'experiencias', 'stack-tecnica', 'resultados-profissionais']) {
        expect(element.querySelector('#' + id)).toBeTruthy();
        expect(element.querySelector(`a[href="#${id}"]`)).toBeTruthy();
      }
      expect(element.querySelector('a[href="#apresentacao"]')).toBeTruthy();
      expect([...element.querySelectorAll('section')]).toEqual(sections);
      expect([...element.querySelectorAll('section')].map((section) => section.id)).toEqual([
        'sobre-mim',
        'stack-tecnica',
        'experiencias',
        'resultados-profissionais',
        'formacao-academica',
        'contato',
      ]);
      expect(element.querySelectorAll('nav a')).toHaveLength(7);
    }
  });

  it('renders the navigation in the site header instead of the presentation block', async () => {
    const { element } = await render();

    expect(element.querySelector('.site-header nav')).toBeTruthy();
    expect(element.querySelector('.page-header nav')).toBeNull();
    expect(element.querySelectorAll('.site-header nav a')).toHaveLength(7);
  });

  it('aplica a mesma ordem editorial às seções e ao menu', async () => {
    editorialOrder.set([
      'presentation-section',
      'skills-section',
      'about-section',
      'experiences-section',
      'results-section',
      'education-section',
      'contact-section',
    ]);
    const { element } = await render();
    expect(
      [...element.querySelectorAll('.sections > section')].map((section) => section.id).slice(0, 2),
    ).toEqual(['stack-tecnica', 'sobre-mim']);
    expect(
      [...element.querySelectorAll('.site-header nav a')]
        .map((link) => link.getAttribute('href'))
        .slice(0, 3),
    ).toEqual(['#apresentacao', '#stack-tecnica', '#sobre-mim']);
  });

  it('renders the approved skills, academic background, contact links and curriculum', async () => {
    curriculumRows = {
      'pt-BR': createCurriculum('pt-BR'),
      en: createCurriculum('en'),
    };
    const { element } = await render();

    expect(element.querySelector('#stack-tecnica h2')?.textContent).toContain('Habilidades');
    expect(element.querySelectorAll('.skill-category')).toHaveLength(6);
    expect(
      element.querySelector('[data-testid="skills-languages-runtime"]')?.textContent,
    ).toContain('JavaScript');
    expect(element.querySelector('#formacao-academica')).toBeTruthy();
    expect(element.querySelectorAll('.academic-card')).toHaveLength(1);
    expect(element.querySelector('#formacao-academica')?.textContent).toContain('Período');
    expect(element.querySelector('#formacao-academica')?.textContent).toContain('Visão Computacional');
    expect(element.querySelector('#formacao-academica')?.textContent).toContain('Ciência da Computação');
    expect(element.querySelector('#contato')).toBeTruthy();
    expect([...element.querySelectorAll('section')].at(-1)?.id).toBe('contato');
    expect(
      (element.querySelector('[data-testid="contact-linkedin"]') as HTMLAnchorElement).href,
    ).toBe('https://www.linkedin.com/in/xjoaovitordf/');
    expect(
      (element.querySelector('[data-testid="contact-github"]') as HTMLAnchorElement).href,
    ).toBe('https://github.com/joaovitordf');
    expect((element.querySelector('[data-testid="contact-email"]') as HTMLAnchorElement).href).toBe(
      'mailto:profissional.joaovitordf@gmail.com',
    );
    expect((element.querySelector('[data-testid="contact-phone"]') as HTMLAnchorElement).href).toBe(
      'tel:+553799429018',
    );
    expect(element.querySelector('[data-testid="contact-links"]')?.textContent).toContain(
      'LinkedIn',
    );
    expect(
      element.querySelectorAll('[data-testid="compact-contact-links"] .compact-contact-link'),
    ).toHaveLength(4);
    expect(element.querySelectorAll('.section-index')).toHaveLength(0);
    expect(
      (element.querySelector('[data-testid="contact-curriculum"]') as HTMLAnchorElement).href,
    ).toBe('https://storage.test/curriculum-pt-BR.pdf');
  });

  it('switches the curriculum and translated labels with the selected language', async () => {
    curriculumRows = {
      'pt-BR': createCurriculum('pt-BR'),
      en: createCurriculum('en'),
    };
    const { fixture, element } = await render();
    const select = element.querySelector('select')!;
    select.value = 'en';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(element.querySelector('#stack-tecnica h2')?.textContent).toContain('Skills');
    expect(element.querySelector('#formacao-academica')?.textContent).toContain('Computer Science');
    expect(
      (element.querySelector('[data-testid="contact-curriculum"]') as HTMLAnchorElement).href,
    ).toBe('https://storage.test/curriculum-en.pdf');
  });

  it('keeps contact usable when the selected curriculum is unavailable', async () => {
    curriculumRows = { 'pt-BR': null };
    const { element } = await render();

    expect(element.querySelector('#contato')).toBeTruthy();
    expect(element.querySelector('[data-testid="contact-curriculum"]')).toBeNull();
    expect(element.querySelector('[data-testid="contact-linkedin"]')).toBeTruthy();
  });

  it.each([
    'apresentacao',
    'sobre-mim',
    'experiencias',
    'stack-tecnica',
    'resultados-profissionais',
  ])('scrolls smoothly to %s', async (id) => {
    const { element } = await render();
    const target = element.querySelector('#' + id)!;
    const scrollIntoView = vi.fn();
    Object.defineProperty(target, 'scrollIntoView', { configurable: true, value: scrollIntoView });
    (element.querySelector(`a[href="#${id}"]`) as HTMLAnchorElement).click();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('renders the structured experiences in chronological order', async () => {
    const { element } = await render();
    const experiences = [...element.querySelectorAll<HTMLElement>('.experience-card')];

    expect(experiences.map((experience) => experience.dataset['testid'])).toEqual([
      'professional-experience-newer',
      'professional-experience-older',
    ]);
    expect(experiences[0]?.textContent).not.toContain('Dairy Corp');
    expect(experiences[0]?.textContent).not.toContain('Digital Corp');
    expect(experiences[0]?.textContent).toContain('05/2025 – 03/2026');
    expect(experiences[0]?.textContent).toContain('Engenheiro de software');
    expect(experiences[0]?.textContent).toContain('Setor de laticínios');
    expect(experiences[0]?.textContent).toContain('Responsabilidade nova');
    expect(experiences[0]?.textContent).toContain('Decisão nova');
    expect(experiences[0]?.textContent).toContain('Resultado novo');
  });

  it('hides the experience section and navigation when no experience is available', async () => {
    experienceRows = [];
    const { element } = await render();

    expect(element.querySelector('#experiencias')).toBeNull();
    expect(element.querySelector('a[href="#experiencias"]')).toBeNull();
    expect(element.querySelector('#sobre-mim')).toBeTruthy();
    expect(element.querySelector('#stack-tecnica')).toBeTruthy();
  });

  it('reloads translated experience fields when the language changes', async () => {
    const { fixture, element } = await render();
    const select = element.querySelector('select')!;
    select.value = 'en';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(element.querySelector('.experience-title')?.textContent).toContain('Software Engineer');
    expect(element.querySelector('.experience-block p')?.textContent).toContain('Dairy industry');
  });

  it('keeps the page usable when the actual navigation target is missing', async () => {
    const { element } = await render();
    element.querySelector('#sobre-mim')!.remove();
    expect(() =>
      (element.querySelector('a[href="#sobre-mim"]') as HTMLAnchorElement).click(),
    ).not.toThrow();
    expect(element.querySelector('[data-testid="portfolio-page"]')).toBeTruthy();
  });

  it('hides a feature section when its original content is unavailable', async () => {
    const originalTitle = ORIGINAL_COPY.aboutTitle;
    const originalBody = ORIGINAL_COPY.aboutBody;
    ORIGINAL_COPY.aboutTitle = '';
    ORIGINAL_COPY.aboutBody = '';
    try {
      const { element } = await render();
      expect(element.querySelector('#sobre-mim')).toBeNull();
      expect(element.querySelector('a[href="#sobre-mim"]')).toBeNull();
      expect(element.querySelector('#apresentacao')).toBeTruthy();
      expect(element.querySelector('#experiencias')).toBeTruthy();
    } finally {
      ORIGINAL_COPY.aboutTitle = originalTitle;
      ORIGINAL_COPY.aboutBody = originalBody;
    }
  });

  it('switches manually and preserves section nodes (AC-003)', async () => {
    const { fixture, element } = await render();
    const select = element.querySelector('select')!;
    const section = element.querySelector('#sobre-mim');
    select.value = 'en';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(element.querySelector('#sobre-mim-title .translated-text')?.textContent).toBe(
      'About me',
    );
    expect(document.documentElement.lang).toBe('en');
    expect(element.querySelector('#sobre-mim')).toBe(section);
    select.value = 'pt-BR';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(element.querySelector('#sobre-mim-title .translated-text')?.textContent).toBe(
      'Sobre mim',
    );
  });

  it.each([true, false])('responds to the popup; accept=%s', async (accept) => {
    TestBed.overrideProvider(BROWSER_LANGUAGE, { useValue: () => 'es' });
    const { fixture, element } = await render();
    const service = TestBed.inject(PortfolioLanguageService);
    service.initialize();
    expect(service.showSuggestion()).toBe(true);
    const buttons = element.querySelectorAll<HTMLButtonElement>('dialog button');
    buttons[accept ? 1 : 0].click();
    await fixture.whenStable();
    expect(service.language()).toBe(accept ? 'en' : 'pt-BR');
    expect(service.showSuggestion()).toBe(false);
  });

  it('does not interpret Escape as refusal', async () => {
    const { element } = await render();
    const cancel = new Event('cancel', { cancelable: true });
    element.querySelector('dialog')!.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
  });

  it('renders original content on source failure while retaining section nodes', async () => {
    TestBed.overrideProvider(TRANSLATION_SOURCE, {
      useValue: () => {
        throw new Error('failed');
      },
    });
    const { fixture, element } = await render();
    const section = element.querySelector('#sobre-mim');
    TestBed.inject(PortfolioLanguageService).choose('en');
    await fixture.whenStable();
    expect(element.querySelector('#sobre-mim .translated-text')?.textContent).toBe(
      ORIGINAL_COPY.aboutTitle,
    );
    expect(element.querySelector('#sobre-mim')).toBe(section);
  });

  it('renders the approved professional results in the happy path', async () => {
    const { element } = await render();
    expect(element.querySelector('#resultados-profissionais')).toBeTruthy();
    expect(element.querySelector('a[href="#resultados-profissionais"]')).toBeTruthy();
    expect(element.querySelectorAll('.result-card')).toHaveLength(4);
    expect(
      element.querySelector('[data-testid="professional-result-time-reduction"]')?.textContent,
    ).toContain('85%');
    expect(
      element.querySelector('[data-testid="professional-result-steps-reduction"]')?.textContent,
    ).toContain('83,6%');
    expect(
      element.querySelector('[data-testid="professional-result-users-served"]')?.textContent,
    ).toContain('50');
    expect(
      element.querySelector('[data-testid="professional-result-productivity-gain"]')?.textContent,
    ).toContain('60%');
  });

  it('renders only the approved professional results that are available', async () => {
    const original = {
      resultsTimeReduction: ORIGINAL_COPY.resultsTimeReduction,
      resultsStepsReduction: ORIGINAL_COPY.resultsStepsReduction,
      resultsUsersServed: ORIGINAL_COPY.resultsUsersServed,
      resultsProductivityGain: ORIGINAL_COPY.resultsProductivityGain,
    };
    ORIGINAL_COPY.resultsTimeReduction = '';
    ORIGINAL_COPY.resultsStepsReduction = '';
    try {
      const { element } = await render();
      expect(element.querySelector('#resultados-profissionais')).toBeTruthy();
      expect(element.querySelectorAll('.result-card')).toHaveLength(2);
      expect(
        element.querySelector('[data-testid="professional-result-users-served"]'),
      ).toBeTruthy();
      expect(
        element.querySelector('[data-testid="professional-result-productivity-gain"]'),
      ).toBeTruthy();
      expect(
        element.querySelector('[data-testid="professional-result-time-reduction"]'),
      ).toBeNull();
      expect(
        element.querySelector('[data-testid="professional-result-steps-reduction"]'),
      ).toBeNull();
    } finally {
      ORIGINAL_COPY.resultsTimeReduction = original.resultsTimeReduction;
      ORIGINAL_COPY.resultsStepsReduction = original.resultsStepsReduction;
      ORIGINAL_COPY.resultsUsersServed = original.resultsUsersServed;
      ORIGINAL_COPY.resultsProductivityGain = original.resultsProductivityGain;
    }
  });

  it('hides the professional results section when no approved result is available', async () => {
    const original = {
      resultsTimeReduction: ORIGINAL_COPY.resultsTimeReduction,
      resultsStepsReduction: ORIGINAL_COPY.resultsStepsReduction,
      resultsUsersServed: ORIGINAL_COPY.resultsUsersServed,
      resultsProductivityGain: ORIGINAL_COPY.resultsProductivityGain,
    };
    ORIGINAL_COPY.resultsTimeReduction = '';
    ORIGINAL_COPY.resultsStepsReduction = '';
    ORIGINAL_COPY.resultsUsersServed = '';
    ORIGINAL_COPY.resultsProductivityGain = '';
    try {
      const { element } = await render();
      expect(element.querySelector('#resultados-profissionais')).toBeNull();
      expect(element.querySelector('a[href="#resultados-profissionais"]')).toBeNull();
      expect(element.querySelector('#experiencias')).toBeTruthy();
    } finally {
      ORIGINAL_COPY.resultsTimeReduction = original.resultsTimeReduction;
      ORIGINAL_COPY.resultsStepsReduction = original.resultsStepsReduction;
      ORIGINAL_COPY.resultsUsersServed = original.resultsUsersServed;
      ORIGINAL_COPY.resultsProductivityGain = original.resultsProductivityGain;
    }
  });

  it('uses the original approved result when the selected translation is missing', async () => {
    TestBed.overrideProvider(TRANSLATION_SOURCE, {
      useValue: () => ({
        ...ENGLISH_COPY,
        resultsTimeReduction: '',
      }),
    });
    const { fixture, element } = await render();
    TestBed.inject(PortfolioLanguageService).choose('en');
    await fixture.whenStable();
    expect(
      element.querySelector('[data-testid="professional-result-time-reduction"] p .translated-text')
        ?.textContent,
    ).toContain(ORIGINAL_COPY.resultsTimeReduction);
    expect(
      element.querySelector(
        '[data-testid="professional-result-steps-reduction"] p .translated-text',
      )?.textContent,
    ).toContain(ENGLISH_COPY.resultsStepsReduction);
  });

  it('renders project summaries and links to complete project pages', async () => {
    projectRows = [
      createProject('professional-1', 'professional', 2),
      createProject('personal-1', 'personal', 1),
    ];
    const { element } = await render();

    expect(element.querySelector('#projetos')).toBeTruthy();
    expect(element.querySelector('a[href="#projetos"]')).toBeTruthy();
    expect(element.querySelector('[data-testid="professional-projects"]')).toBeTruthy();
    expect(element.querySelector('[data-testid="personal-projects"]')).toBeTruthy();

    const professional = element.querySelector(
      '[data-testid="professional-project-professional-1"]',
    )!;
    expect(professional.textContent).toContain('Projeto professional-1');
    expect(professional.textContent).not.toContain('Papel professional-1');
    expect(professional.textContent).not.toContain('Resultado professional-1');
    for (const value of [
      'Descrição professional-1',
      'Contexto professional-1',
      'Tecnologia professional-1',
    ]) {
      expect(professional.textContent).toContain(value);
    }
    expect(element.querySelector('[data-testid="personal-project-personal-1"]')).toBeTruthy();
    expect((professional.querySelector('.project-full-link') as HTMLAnchorElement).href).toBe(
      new URL('/projetos/professional-1', document.baseURI).href,
    );
  });

  it('hides an empty project subsection and the entire section when no projects are complete', async () => {
    projectRows = [createProject('professional-1', 'professional', 1)];
    const { element } = await render();
    expect(element.querySelector('[data-testid="professional-projects"]')).toBeTruthy();
    expect(element.querySelector('[data-testid="personal-projects"]')).toBeNull();

    projectRows = [];
    const empty = await render();
    expect(empty.element.querySelector('#projetos')).toBeNull();
    expect(empty.element.querySelector('a[href="#projetos"]')).toBeNull();
  });

  it('filters incomplete projects and does not render an empty links block', async () => {
    const incomplete = createProject('incomplete', 'personal', 1);
    incomplete.description = '';
    const withoutLinks = createProject('without-links', 'personal', 2);
    withoutLinks.links = [];
    projectRows = [incomplete, withoutLinks];

    const { element } = await render();

    expect(element.querySelector('[data-testid="personal-project-incomplete"]')).toBeNull();
    expect(element.querySelector('[data-testid="personal-project-without-links"]')).toBeTruthy();
    expect(
      element.querySelector('[data-testid="personal-project-without-links"] .project-links'),
    ).toBeNull();
  });

  it('reloads project translations when the language changes', async () => {
    projectRows = [createProject('personal-1', 'personal', 1)];
    const { fixture, element } = await render();

    const select = element.querySelector('select')!;
    select.value = 'en';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    const project = element.querySelector('[data-testid="personal-project-personal-1"]');
    expect(project?.textContent).toContain('English Projeto personal-1');
    expect(project?.textContent).toContain('English description');
    expect(project?.textContent).toContain('English context');
    expect(
      element.querySelector('[data-testid="personal-projects"] .project-subsection-title')
        ?.textContent,
    ).toContain('Personal projects');
  });

  function createExperiences(locale: 'pt-BR' | 'en'): PortfolioExperience[] {
    const english = locale === 'en';
    return [
      {
        id: 'newer',
        startDate: '2025-05-01',
        endDate: '2026-03-01',
        displayOrder: 2,
        title: english ? 'Software Engineer' : 'Engenheiro de software',
        context: english ? 'Dairy industry' : 'Setor de laticínios',
        responsibilities: [english ? 'New responsibility' : 'Responsabilidade nova'],
        technicalDecisions: [english ? 'New decision' : 'Decisão nova'],
        results: [english ? 'New result' : 'Resultado novo'],
      },
      {
        id: 'older',
        startDate: '2023-12-01',
        endDate: '2025-05-01',
        displayOrder: 1,
        title: english ? 'Developer' : 'Desenvolvedor',
        context: english ? 'Corporate digitization' : 'Digitalização corporativa',
        responsibilities: [english ? 'Old responsibility' : 'Responsabilidade antiga'],
        technicalDecisions: [english ? 'Old decision' : 'Decisão antiga'],
        results: [english ? 'Old result' : 'Resultado antigo'],
      },
    ];
  }

  function createProject(
    id: string,
    type: 'professional' | 'personal',
    displayOrder: number,
  ): PortfolioProject {
    return {
      id,
      displayOrder,
      type,
      locale: 'pt-BR',
      name: 'Projeto ' + id,
      description: 'Descrição ' + id,
      problemContext: 'Contexto ' + id,
      solution: 'Solução ' + id,
      role: 'Papel ' + id,
      technicalDecisions: ['Decisão ' + id],
      technologies: ['Tecnologia ' + id],
      results: ['Resultado ' + id],
      learnings: ['Aprendizado ' + id],
      links: [{ label: 'Site ' + id, url: 'https://example.com/' + id }],
      images: [],
    };
  }

  function createCurriculum(locale: 'pt-BR' | 'en'): PortfolioFile {
    return {
      id: 'curriculum-' + locale,
      fileType: 'curriculum',
      locale,
      storagePath: 'curriculum-' + locale + '.pdf',
      originalName: 'curriculum-' + locale + '.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1000,
      publicUrl: 'https://storage.test/curriculum-' + locale + '.pdf',
    };
  }
});
