import { describe, expect, it } from 'vitest';
import snapshotJson from '../../../../../spec/05-verificacao/ativacao-painel-admin-joao-vitor/initial-editorial-snapshot-joao-v1.json';
import type { EditorialSnapshotV1 } from './editorial-snapshot.models';
import {
  snapshotToAcademicEntries,
  snapshotToContactLinks,
  snapshotToCopy,
  snapshotToExperiences,
  snapshotToProjects,
  snapshotToSectionOrder,
  snapshotToSkillCategories,
} from './editorial-snapshot-adapter';

describe('editorial-snapshot-adapter', () => {
  const snapshot = snapshotJson as unknown as EditorialSnapshotV1;

  it('projects copy texts correctly for pt-BR and en', () => {
    const ptCopy = snapshotToCopy(snapshot, 'pt-BR');
    expect(ptCopy.aboutTitle).toBe('Sobre mim');
    expect(ptCopy.resultsTitle).toBe('Resultados profissionais');

    const enCopy = snapshotToCopy(snapshot, 'en');
    expect(enCopy.aboutTitle).toBe('About me');
    expect(enCopy.resultsTitle).toBe('Professional results');
  });

  it('projects experiences with details and list items', () => {
    const experiences = snapshotToExperiences(snapshot, 'pt-BR');
    expect(experiences.length).toBe(4);

    const first = experiences[0]!;
    expect(first.title).toBe('Desenvolvedor Front-end · SensorEng');
    expect(first.responsibilities.length).toBeGreaterThan(0);
    expect(first.technicalDecisions.length).toBeGreaterThan(0);
    expect(first.results.length).toBeGreaterThan(0);

    const enExperiences = snapshotToExperiences(snapshot, 'en');
    expect(enExperiences[0]!.title).toBe('Frontend Developer · SensorEng');
  });

  it('projects projects with technologies, links, and details', () => {
    const projects = snapshotToProjects(snapshot, 'pt-BR');
    expect(projects.length).toBe(2);

    const russian = projects.find((p) => p.name.includes('Russian'))!;
    expect(russian).toBeDefined();
    expect(russian.technologies).toContain('Angular');
    expect(russian.technologies).toContain('FastAPI');
    expect(russian.links[0]?.label).toBe('GitHub');
    expect(russian.links[0]?.url).toBe('https://github.com/joaovitordf');

    const boxing = projects.find((p) => p.name.includes('Boxe'))!;
    expect(boxing).toBeDefined();
    expect(boxing.technologies).toContain('Python');
    expect(boxing.technologies).toContain('OpenCV');
  });

  it('projects skill categories and skills', () => {
    const categories = snapshotToSkillCategories(snapshot, 'pt-BR');
    expect(categories.length).toBeGreaterThan(0);

    const languages = categories.find((c) => c.label === 'Linguagens e runtime')!;
    expect(languages).toBeDefined();
    expect(languages.skills.some((s) => s.name === 'TypeScript')).toBe(true);
  });

  it('projects academic entries', () => {
    const entries = snapshotToAcademicEntries(snapshot, 'pt-BR');
    expect(entries.length).toBe(1);
    const firstAcademic = entries[0]!;
    expect(firstAcademic.institution).toBe('Instituto Federal de Minas Gerais (IFMG)');
    expect(firstAcademic.isCurrent).toBe(false);
    expect((firstAcademic.competencies ?? []).length).toBeGreaterThan(0);
  });

  it('projects contact links', () => {
    const contacts = snapshotToContactLinks(snapshot, 'pt-BR');
    expect(contacts.length).toBeGreaterThanOrEqual(4);
    expect(contacts.some((c) => c.symbol === 'github')).toBe(true);
    expect(contacts.some((c) => c.symbol === 'linkedin')).toBe(true);
  });

  it('projects section order', () => {
    const order = snapshotToSectionOrder(snapshot);
    expect(order).toEqual([
      'presentation-section',
      'about-section',
      'results-section',
      'experiences-section',
      'projects-section',
      'skills-section',
      'education-section',
      'contact-section',
    ]);
  });
});
