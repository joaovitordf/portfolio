import { TestBed } from '@angular/core/testing';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { PortfolioContentService } from './portfolio-content.service';
import { PublishedSnapshotService } from './published-snapshot.service';
import snapshotJson from '../../../../../spec/05-verificacao/ativacao-painel-admin-joao-vitor/initial-editorial-snapshot-joao-v1.json';

describe('PortfolioContentService', () => {
  it('loads the selected translation and keeps the content key', async () => {
    const client = fakeClient({
      portfolio_texts: [{ id: 'text-1', content_key: 'aboutTitle' }],
      portfolio_text_translations: [{ text_id: 'text-1', locale: 'en', value: 'About me' }],
    });
    const service = configure(client);

    await expect(service.loadCopy('en')).resolves.toEqual({ aboutTitle: 'About me' });
    expect(service.lastError()).toBeNull();
  });

  it('maps projects with type, links and related ordered images', async () => {
    const client = fakeClient({
      portfolio_projects: [{ id: 'project-1', project_type: 'professional', display_order: 1 }],
      portfolio_project_translations: [
        {
          project_id: 'project-1',
          locale: 'pt-BR',
          name: 'Projeto',
          description: 'Descrição',
          problem_context: 'Problema',
          solution: 'Solução',
          role: 'Autor',
          technical_decisions: ['Decisão'],
          technologies: ['Angular'],
          results: ['Resultado'],
          learnings: ['Aprendizado'],
          links: [{ label: 'Site', url: 'https://example.com' }],
        },
      ],
      portfolio_project_images: [
        {
          id: 'image-1',
          project_id: 'project-1',
          storage_path: 'project-1/01.png',
          original_name: '01.png',
          mime_type: 'image/png',
          size_bytes: 100,
          display_order: 1,
        },
        {
          id: 'image-2',
          project_id: 'project-1',
          storage_path: 'project-1/02.jpg',
          original_name: '02.jpg',
          mime_type: 'image/jpeg',
          size_bytes: 200,
          display_order: 2,
        },
      ],
    });
    const service = configure(client);

    const [project] = await service.listProjects('pt-BR');

    expect(project).toMatchObject({
      id: 'project-1',
      type: 'professional',
      displayOrder: 1,
      name: 'Projeto',
      description: 'Descrição',
      problemContext: 'Problema',
      role: 'Autor',
      technicalDecisions: ['Decisão'],
      technologies: ['Angular'],
      results: ['Resultado'],
      learnings: ['Aprendizado'],
      links: [{ label: 'Site', url: 'https://example.com' }],
    });
    expect(project.images.map((image) => image.publicUrl)).toEqual([
      'https://storage.test/project-1/01.png',
      'https://storage.test/project-1/02.jpg',
    ]);
  });

  it('orders projects by display_order and skips unknown types', async () => {
    const client = fakeClient({
      portfolio_projects: [
        { id: 'personal', project_type: 'personal', display_order: 2 },
        { id: 'unknown', project_type: 'other', display_order: 0 },
        { id: 'professional', project_type: 'professional', display_order: 1 },
      ],
      portfolio_project_translations: [
        { project_id: 'personal', locale: 'pt-BR', name: 'Pessoal' },
        { project_id: 'professional', locale: 'pt-BR', name: 'Profissional' },
      ],
    });
    const service = configure(client);

    const projects = await service.listProjects('pt-BR');

    expect(projects.map((project) => project.id)).toEqual(['professional', 'personal']);
    expect(projects.map((project) => project.type)).toEqual(['professional', 'personal']);
  });

  it('uses pt-BR as fallback for a missing English project translation', async () => {
    const client = fakeClient({
      portfolio_projects: [{ id: 'project-1', project_type: 'personal', display_order: 1 }],
      portfolio_project_translations: [
        {
          project_id: 'project-1',
          locale: 'pt-BR',
          name: 'Projeto',
          description: 'Descrição',
          problem_context: 'Contexto',
          role: 'Papel',
          technical_decisions: ['Decisão PT'],
          technologies: ['Angular'],
          results: ['Resultado PT'],
          learnings: ['Aprendizado PT'],
          links: [{ label: 'Site', url: 'https://example.com' }],
        },
      ],
    });
    const service = configure(client);

    const [project] = await service.listProjects('en');

    expect(project).toMatchObject({
      locale: 'en',
      name: 'Projeto',
      description: 'Descrição',
      problemContext: 'Contexto',
      role: 'Papel',
      technicalDecisions: ['Decisão PT'],
      technologies: ['Angular'],
      results: ['Resultado PT'],
      learnings: ['Aprendizado PT'],
      links: [{ label: 'Site', url: 'https://example.com' }],
    });
  });

  it('orders experiences by start date then display order without exposing company names', async () => {
    const client = fakeClient({
      portfolio_experiences: [
        {
          id: 'older',
          start_date: '2023-12-01',
          end_date: '2025-05-01',
          name: 'Digital Corp',
          display_order: 1,
        },
        {
          id: 'newer',
          start_date: '2025-05-01',
          end_date: '2026-03-01',
          name: 'Dairy Corp',
          display_order: 2,
        },
        {
          id: 'tie-first',
          start_date: '2024-01-01',
          end_date: '2024-06-01',
          name: 'Tie First',
          display_order: 2,
        },
        {
          id: 'tie-second',
          start_date: '2024-01-01',
          end_date: '2024-07-01',
          name: 'Tie Second',
          display_order: 1,
        },
      ],
      portfolio_experience_translations: [
        {
          experience_id: 'older',
          locale: 'pt-BR',
          title: 'Desenvolvedor',
          context: 'Digitalização corporativa',
          responsibilities: ['Responsabilidade antiga'],
          technical_decisions: ['Decisão antiga'],
          results: ['Resultado antigo'],
        },
        {
          experience_id: 'newer',
          locale: 'pt-BR',
          title: 'Engenheiro de software',
          context: 'Setor de laticínios',
          responsibilities: ['Responsabilidade nova'],
          technical_decisions: ['Decisão nova'],
          results: ['Resultado novo'],
        },
        {
          experience_id: 'tie-first',
          locale: 'pt-BR',
          title: 'Cargo 1',
          context: 'Contexto 1',
          responsibilities: ['Responsabilidade 1'],
          technical_decisions: ['Decisão 1'],
          results: ['Resultado 1'],
        },
        {
          experience_id: 'tie-second',
          locale: 'pt-BR',
          title: 'Cargo 2',
          context: 'Contexto 2',
          responsibilities: ['Responsabilidade 2'],
          technical_decisions: ['Decisão 2'],
          results: ['Resultado 2'],
        },
      ],
    });
    const service = configure(client);

    const experiences = await service.listExperiences('pt-BR');

    expect(experiences.map((experience) => experience.id)).toEqual([
      'newer',
      'tie-second',
      'tie-first',
      'older',
    ]);
    expect(experiences[0]).toMatchObject({
      title: 'Engenheiro de software',
      context: 'Setor de laticínios',
      responsibilities: ['Responsabilidade nova'],
      technicalDecisions: ['Decisão nova'],
      results: ['Resultado novo'],
    });
  });

  it('returns a safe fallback and exposes the error when a query fails', async () => {
    const service = configure(fakeClient({}, new Error('network unavailable')));

    await expect(service.listExperiences('pt-BR')).resolves.toEqual([]);
    expect(service.lastError()?.message).toBe('network unavailable');
  });

  it('returns an empty project collection and exposes the error when project loading fails', async () => {
    const service = configure(fakeClient({}, new Error('project query failed')));

    await expect(service.listProjects('pt-BR')).resolves.toEqual([]);
    expect(service.lastError()?.message).toBe('project query failed');
  });

  it('maps the curriculum for the selected locale and creates its public URL', async () => {
    const service = configure(
      fakeClient({
        portfolio_files: [
          {
            id: 'curriculum-en',
            file_type: 'curriculum',
            locale: 'en',
            storage_path: 'curricula/curriculum-en.pdf',
            original_name: 'resume-en.pdf',
            mime_type: 'application/pdf',
            size_bytes: 1200,
          },
        ],
      }),
    );

    await expect(service.getCurriculum('en')).resolves.toMatchObject({
      id: 'curriculum-en',
      locale: 'en',
      originalName: 'resume-en.pdf',
      mimeType: 'application/pdf',
      publicUrl: 'https://storage.test/curricula/curriculum-en.pdf',
    });
    expect(service.lastError()).toBeNull();
  });

  it('rejects missing or non-PDF curriculum metadata safely', async () => {
    const service = configure(
      fakeClient({
        portfolio_files: [
          {
            id: 'curriculum-invalid',
            file_type: 'curriculum',
            locale: 'pt-BR',
            storage_path: 'curricula/curriculum-invalid.docx',
            original_name: 'curriculum-invalid.docx',
            mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size_bytes: 1200,
          },
        ],
      }),
    );

    await expect(service.getCurriculum('pt-BR')).resolves.toBeNull();
    expect(service.lastError()?.message).toBe('Invalid curriculum metadata');
  });

  it('returns empty content when public runtime configuration is absent', async () => {
    const service = configure(null);

    await expect(service.loadCopy('pt-BR')).resolves.toEqual({});
    await expect(service.listProjects('pt-BR')).resolves.toEqual([]);
    await expect(service.getCurriculum('pt-BR')).resolves.toBeNull();
  });

  it('loads editable skills, academic entries and contacts from the persisted catalogues', async () => {
    const service = configure(
      fakeClient({
        portfolio_skill_categories: [
          { id: 'category-1', category_key: 'frontend', display_order: 1 },
        ],
        portfolio_skill_category_translations: [
          { category_id: 'category-1', locale: 'en', label: 'Frontend' },
        ],
        portfolio_skills: [
          {
            id: 'skill-1',
            category_id: 'category-1',
            display_order: 1,
            icon_url: 'https://example.com/angular.svg',
            icon_storage_path: null,
          },
        ],
        portfolio_skill_translations: [{ skill_id: 'skill-1', locale: 'en', name: 'Angular' }],
        portfolio_academic_entries: [
          {
            id: 'academic-1',
            display_order: 1,
            start_date: '2024-01-01',
            end_date: null,
            is_current: true,
          },
        ],
        portfolio_academic_entry_translations: [
          {
            entry_id: 'academic-1',
            locale: 'en',
            name: 'Data Science',
            institution: 'University',
            competencies: ['Modeling'],
            studied_content: ['Statistics'],
          },
        ],
        portfolio_contact_links: [
          {
            id: 'contact-1',
            symbol: 'github',
            href: 'https://github.com/example',
            display_order: 1,
          },
        ],
        portfolio_contact_link_translations: [
          { contact_id: 'contact-1', locale: 'en', label: 'GitHub' },
        ],
      }),
    );

    await expect(service.listSkillCategories('en')).resolves.toMatchObject([
      {
        id: 'category-1',
        label: 'Frontend',
        skills: [{ name: 'Angular', iconUrl: 'https://example.com/angular.svg' }],
      },
    ]);
    await expect(service.listAcademicEntries('en')).resolves.toMatchObject([
      {
        id: 'academic-1',
        name: 'Data Science',
        institution: 'University',
        startDate: '2024-01-01',
        isCurrent: true,
        competencies: ['Modeling'],
        studiedContent: ['Statistics'],
      },
    ]);
    await expect(service.listContactLinks('en')).resolves.toMatchObject([
      { id: 'contact-1', label: 'GitHub', href: 'https://github.com/example', symbol: 'github' },
    ]);
  });

  it('loads copy, experiences, projects, and section order from PublishedSnapshotService when available', async () => {
    const fakeSnapshotService = {
      snapshot: () => null,
      load: vi.fn(async () => snapshotJson),
      clear: () => undefined,
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        PortfolioContentService,
        { provide: SUPABASE_CLIENT, useValue: null },
        { provide: PublishedSnapshotService, useValue: fakeSnapshotService },
      ],
    });
    const service = TestBed.inject(PortfolioContentService);

    const copy = await service.loadCopy('pt-BR');
    expect(copy.aboutTitle).toBe('Sobre mim');

    const experiences = await service.listExperiences('pt-BR');
    expect(experiences.length).toBe(4);
    expect(experiences[0]?.title).toBe('Desenvolvedor Front-end · SensorEng');

    const projects = await service.listProjects('pt-BR');
    expect(projects.length).toBe(2);

    const sectionOrder = await service.listSectionOrder();
    expect(sectionOrder).toContain('presentation-section');
  });
});

function configure(client: SupabaseClient | null): PortfolioContentService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [PortfolioContentService, { provide: SUPABASE_CLIENT, useValue: client }],
  });
  return TestBed.inject(PortfolioContentService);
}

function fakeClient(rows: Record<string, unknown[]>, failure: Error | null = null): SupabaseClient {
  const client = {
    from(table: string) {
      return query(rows[table] ?? [], failure);
    },
    storage: {
      from() {
        return {
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://storage.test/${path}` } };
          },
        };
      },
    },
  };
  return client as unknown as SupabaseClient;
}

function query(data: unknown[], error: Error | null) {
  let current = [...data];
  const builder: Record<string, unknown> & { then: Promise<unknown>['then'] } = {
    select: () => builder,
    in: (key: string, values: unknown[]) => {
      current = current.filter((row) => {
        if (!row || typeof row !== 'object') return false;
        return values.includes((row as Record<string, unknown>)[key]);
      });
      return builder;
    },
    eq: (key: string, value: unknown) => {
      current = current.filter((row) => {
        if (!row || typeof row !== 'object') return false;
        return (row as Record<string, unknown>)[key] === value;
      });
      return builder;
    },
    order: (key: string, options: { ascending?: boolean }) => {
      current.sort((left, right) => {
        const leftValue =
          left && typeof left === 'object' ? (left as Record<string, unknown>)[key] : null;
        const rightValue =
          right && typeof right === 'object' ? (right as Record<string, unknown>)[key] : null;
        const comparison = String(leftValue ?? '').localeCompare(String(rightValue ?? ''));
        return options.ascending === false ? -comparison : comparison;
      });
      return builder;
    },
    maybeSingle: () => Promise.resolve({ data: current[0] ?? null, error }),
    then: (resolve, reject) => Promise.resolve({ data: current, error }).then(resolve, reject),
  };
  return builder;
}
