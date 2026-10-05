import { computed, inject, Injectable, signal } from '@angular/core';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { PortfolioContentService } from './portfolio-content.service';
import { PublishedSnapshotService } from './published-snapshot.service';
import type { EditorialSnapshotEntity, EditorialSnapshotV1 } from './editorial-snapshot.models';
import type { PortfolioCopy } from './portfolio-content';
import type {
  PortfolioAcademicEntry,
  PortfolioContactLink,
  PortfolioExperience,
  PortfolioFile,
  PortfolioLocale,
  PortfolioProject,
  PortfolioProjectImage,
  PortfolioProjectLink,
  PortfolioSkillCategory,
} from './portfolio-content.models';

/** Public portfolio reader backed exclusively by the immutable published snapshot. */
@Injectable()
export class PublishedSnapshotContentService extends PortfolioContentService {
  private readonly published = inject(PublishedSnapshotService);
  private readonly snapshotClient = inject(SUPABASE_CLIENT);
  private readonly snapshotErrorState = signal<Error | null>(null);

  override readonly remoteCopy = computed(() => {
    const snapshot = this.published.snapshot();
    const locale = this.localeState();
    const values = snapshot?.translations[locale] ?? snapshot?.translations['pt-BR'] ?? {};
    return Object.fromEntries(
      Object.entries(values)
        .filter(([id]) => id.startsWith('copy-'))
        .map(([id, fields]) => [id.slice(5), fields['text'] ?? '']),
    ) as Partial<PortfolioCopy>;
  });
  override readonly lastError = this.snapshotErrorState.asReadonly();
  override readonly isAvailable = computed(() => this.snapshotClient !== null && this.published.snapshot() !== null);
  private readonly localeState = signal<PortfolioLocale>('pt-BR');

  override async loadCopy(locale: PortfolioLocale): Promise<Partial<PortfolioCopy>> {
    this.localeState.set(locale);
    await this.loadSnapshot();
    return this.remoteCopy();
  }

  async listSectionOrder(): Promise<string[]> {
    const snapshot = await this.loadSnapshot();
    if (!snapshot) return [];
    return snapshot.sections.slice().sort((a, b) => a.position - b.position).map((section) => section.id);
  }

  override async listExperiences(locale: PortfolioLocale): Promise<PortfolioExperience[]> {
    const snapshot = await this.loadSnapshot();
    if (!snapshot) return [];
    return this.entities(snapshot, 'experience').map(([id, entity]) => ({
      id,
      startDate: stringValue(entity.data['startDate']),
      endDate: nullableString(entity.data['endDate']),
      displayOrder: entity.position,
      title: this.text(snapshot, locale, id, 'title'),
      context: this.text(snapshot, locale, id, 'context'),
      responsibilities: this.list(snapshot, locale, id, 'responsibilities'),
      technicalDecisions: this.list(snapshot, locale, id, 'technicalDecisions'),
      results: this.list(snapshot, locale, id, 'results'),
      editorialListIds: this.listIds(snapshot, id),
    }));
  }

  override async listProjects(locale: PortfolioLocale): Promise<PortfolioProject[]> {
    const snapshot = await this.loadSnapshot();
    if (!snapshot) return [];
    return this.entities(snapshot, 'project').map(([id, entity]) => {
      const technologyIds = Array.isArray(entity.data['technologyIds'])
        ? entity.data['technologyIds'].map(String)
        : [];
      return {
        id,
        displayOrder: entity.position,
        type: entity.data['type'] === 'professional' ? 'professional' : 'personal',
        locale,
        name: this.text(snapshot, locale, id, 'name'),
        description: this.text(snapshot, locale, id, 'description'),
        problemContext: this.text(snapshot, locale, id, 'problemContext'),
        solution: this.text(snapshot, locale, id, 'solution'),
        role: this.text(snapshot, locale, id, 'role'),
        technicalDecisions: this.list(snapshot, locale, id, 'technicalDecisions'),
        technologyIds,
        technologies: technologyIds.map((technologyId) => snapshot.technologies[technologyId]?.label ?? technologyId),
        results: this.list(snapshot, locale, id, 'results'),
        learnings: this.list(snapshot, locale, id, 'learnings'),
        links: this.projectLinks(snapshot, locale, id),
        images: this.projectImages(snapshot, locale, id),
        editorialListIds: this.listIds(snapshot, id),
      } satisfies PortfolioProject;
    });
  }

  override async getCurriculum(locale: PortfolioLocale): Promise<PortfolioFile | null> {
    const snapshot = await this.loadSnapshot();
    if (!snapshot) return null;
    const [id, entity] = this.entities(snapshot, 'curriculum')[0] ?? [];
    if (!id || !entity) return null;
    const mediaId = stringValue(entity.data['mediaId']);
    const media = snapshot.media[mediaId];
    if (!media?.assetPath || media.mime !== 'application/pdf') return null;
    return {
      id,
      fileType: 'curriculum',
      locale,
      storagePath: media.assetPath,
      originalName: this.text(snapshot, locale, id, 'originalName') || 'curriculum.pdf',
      mimeType: 'application/pdf',
      sizeBytes: media.bytes,
      publicUrl: media.assetPath,
    };
  }

  override async listSkillCategories(locale: PortfolioLocale): Promise<PortfolioSkillCategory[]> {
    const snapshot = await this.loadSnapshot();
    if (!snapshot) return [];
    return this.entities(snapshot, 'skillCategory').map(([id, category]) => ({
      id,
      labelKey: '',
      label: this.text(snapshot, locale, id, 'label'),
      displayOrder: category.position,
      skills: this.entities(snapshot, 'skill')
        .filter(([, skill]) => skill.parentId === id)
        .map(([skillId, skill]) => {
          const technologyId = stringValue(skill.data['technologyId']);
          const technology = snapshot.technologies[technologyId];
          const media = technology?.iconMediaId ? snapshot.media[technology.iconMediaId] : undefined;
          return {
            id: skillId.replace(/^skill-/, ''),
            name: this.text(snapshot, locale, skillId, 'name') || technology?.label || technologyId,
            iconUrl: media?.assetPath,
          };
        }),
    }));
  }

  override async listAcademicEntries(locale: PortfolioLocale): Promise<PortfolioAcademicEntry[]> {
    const snapshot = await this.loadSnapshot();
    if (!snapshot) return [];
    return this.entities(snapshot, 'academic').map(([id, entity]) => ({
      id,
      nameKey: '',
      name: this.text(snapshot, locale, id, 'name'),
      institution: this.text(snapshot, locale, id, 'institution'),
      startDate: nullableString(entity.data['startDate']),
      endDate: nullableString(entity.data['endDate']),
      isCurrent: entity.data['isCurrent'] === true,
      competencies: this.list(snapshot, locale, id, 'competencies'),
      studiedContent: this.list(snapshot, locale, id, 'studiedContent'),
      displayOrder: entity.position,
      editorialListIds: this.listIds(snapshot, id),
    }));
  }

  override async listContactLinks(locale: PortfolioLocale): Promise<PortfolioContactLink[]> {
    const snapshot = await this.loadSnapshot();
    if (!snapshot) return [];
    return this.entities(snapshot, 'contact').flatMap(([id, entity]) => {
      const symbol = entity.data['symbol'];
      if (symbol !== 'linkedin' && symbol !== 'github' && symbol !== 'email' && symbol !== 'phone') return [];
      return [{
        id,
        labelKey: '',
        label: this.text(snapshot, locale, id, 'label'),
        href: stringValue(entity.data['href']),
        symbol,
        iconPath: `/assets/contact/${symbol}.svg`,
        displayOrder: entity.position,
      }];
    });
  }

  private async loadSnapshot(): Promise<EditorialSnapshotV1 | null> {
    try {
      const snapshot = await this.published.load();
      this.snapshotErrorState.set(null);
      return snapshot;
    } catch (error) {
      const value = error instanceof Error ? error : new Error(String(error));
      this.snapshotErrorState.set(value);
      return null;
    }
  }

  private entities(snapshot: EditorialSnapshotV1, kind: EditorialSnapshotEntity['kind']) {
    return Object.entries(snapshot.entities)
      .filter(([, entity]) => entity.kind === kind)
      .sort((a, b) => a[1].position - b[1].position);
  }

  private text(snapshot: EditorialSnapshotV1, locale: PortfolioLocale, id: string, field: string): string {
    return snapshot.translations[locale]?.[id]?.[field]
      ?? snapshot.translations['pt-BR']?.[id]?.[field]
      ?? '';
  }

  private list(snapshot: EditorialSnapshotV1, locale: PortfolioLocale, parentId: string, collection: string): string[] {
    return Object.entries(snapshot.entities)
      .filter(([, entity]) => entity.kind === 'listItem' && entity.parentId === parentId && entity.data['collection'] === collection)
      .sort((a, b) => a[1].position - b[1].position)
      .map(([id]) => this.text(snapshot, locale, id, 'text'));
  }

  private listIds(snapshot: EditorialSnapshotV1, parentId: string): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    Object.entries(snapshot.entities)
      .filter(([, entity]) => entity.kind === 'listItem' && entity.parentId === parentId)
      .sort((a, b) => a[1].position - b[1].position)
      .forEach(([id, entity]) => {
        const collection = stringValue(entity.data['collection']);
        if (collection) (result[collection] ??= []).push(id);
      });
    return result;
  }

  private projectLinks(snapshot: EditorialSnapshotV1, locale: PortfolioLocale, parentId: string): PortfolioProjectLink[] {
    return this.entities(snapshot, 'projectLink')
      .filter(([, entity]) => entity.parentId === parentId)
      .map(([id, entity]) => ({ label: this.text(snapshot, locale, id, 'label'), url: stringValue(entity.data['href']) }));
  }

  private projectImages(snapshot: EditorialSnapshotV1, locale: PortfolioLocale, parentId: string): PortfolioProjectImage[] {
    return this.entities(snapshot, 'projectImage')
      .filter(([, entity]) => entity.parentId === parentId)
      .flatMap(([id, entity]) => {
        const media = snapshot.media[stringValue(entity.data['mediaId'])];
        if (!media?.assetPath || (media.mime !== 'image/png' && media.mime !== 'image/jpeg')) return [];
        return [{
          id,
          projectId: parentId,
          storagePath: media.assetPath,
          originalName: this.text(snapshot, locale, id, 'originalName') || id,
          mimeType: media.mime,
          sizeBytes: media.bytes,
          displayOrder: entity.position,
          publicUrl: media.assetPath,
        }];
      });
  }
}

function stringValue(value: unknown): string { return value === null || value === undefined ? '' : String(value); }
function nullableString(value: unknown): string | null { return value === null || value === undefined ? null : String(value); }
