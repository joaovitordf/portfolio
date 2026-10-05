import { computed, inject, Injectable, signal } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { PublishedSnapshotService } from './published-snapshot.service';
import type { EditorialSnapshotV1 } from './editorial-snapshot.models';
import {
  snapshotToAcademicEntries,
  snapshotToContactLinks,
  snapshotToCopy,
  snapshotToCurriculum,
  snapshotToExperiences,
  snapshotToProjects,
  snapshotToSectionOrder,
  snapshotToSkillCategories,
} from './editorial-snapshot-adapter';
import {
  PORTFOLIO_ACADEMIC_ENTRIES,
  PORTFOLIO_CONTACT_LINKS,
  PORTFOLIO_SKILL_CATEGORIES,
  type PortfolioCopy,
} from './portfolio-content';
import {
  type PortfolioAcademicEntry,
  type PortfolioContactLink,
  type PortfolioExperience,
  type PortfolioFile,
  type PortfolioLocale,
  type PortfolioProject,
  type PortfolioProjectImage,
  type PortfolioProjectLink,
  type PortfolioProjectType,
  type PortfolioSkill,
  type PortfolioSkillCategory,
} from './portfolio-content.models';

type Row = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class PortfolioContentService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly snapshotService = inject(PublishedSnapshotService, { optional: true });
  private snapshotPromise: Promise<EditorialSnapshotV1 | null> | null = null;

  private readonly remoteCopyState = signal<Partial<PortfolioCopy>>({});
  private readonly errorState = signal<Error | null>(null);

  readonly remoteCopy = computed(() => this.remoteCopyState());
  readonly lastError = computed(() => this.errorState());
  readonly isAvailable = computed(() => this.client !== null);

  private readonly storageUrlResolver = (bucket: string, path: string): string => {
    return this.client?.storage.from(bucket).getPublicUrl(path).data.publicUrl ?? path;
  };

  private async getSnapshot(): Promise<EditorialSnapshotV1 | null> {
    if (!this.snapshotService) return null;
    const existing = this.snapshotService.snapshot();
    if (existing) return existing;
    if (this.snapshotPromise) return this.snapshotPromise;
    this.snapshotPromise = this.snapshotService.load().catch(() => null);
    return this.snapshotPromise;
  }

  async loadCopy(locale: PortfolioLocale): Promise<Partial<PortfolioCopy>> {
    this.remoteCopyState.set({});
    this.errorState.set(null);

    const snapshot = await this.getSnapshot();
    if (snapshot) {
      const copy = snapshotToCopy(snapshot, locale);
      this.remoteCopyState.set(copy);
      return copy;
    }

    if (!this.client) {
      return {};
    }

    try {
      const { data: texts, error: textsError } = await this.client
        .from('portfolio_texts')
        .select('id, content_key');

      if (textsError) {
        throw textsError;
      }

      const textRows = (texts ?? []) as Row[];
      const ids = textRows.map((row) => String(row['id']));
      if (ids.length === 0) {
        this.remoteCopyState.set({});
        this.errorState.set(null);
        return {};
      }

      const { data: translations, error: translationsError } = await this.client
        .from('portfolio_text_translations')
        .select('text_id, value')
        .in('text_id', ids)
        .eq('locale', locale);

      if (translationsError) {
        throw translationsError;
      }

      const translationByTextId = new Map(
        ((translations ?? []) as Row[]).map((row) => [String(row['text_id']), row['value']]),
      );
      const copy: Record<string, unknown> = {};

      for (const row of textRows) {
        const key = String(row['content_key']);
        if (translationByTextId.has(String(row['id']))) {
          copy[key] = translationByTextId.get(String(row['id']));
        }
      }

      this.remoteCopyState.set(copy as Partial<PortfolioCopy>);
      this.errorState.set(null);
      return copy as Partial<PortfolioCopy>;
    } catch (error) {
      this.errorState.set(toError(error));
      this.remoteCopyState.set({});
      return {};
    }
  }

  async listExperiences(locale: PortfolioLocale): Promise<PortfolioExperience[]> {
    const snapshot = await this.getSnapshot();
    if (snapshot) {
      return snapshotToExperiences(snapshot, locale);
    }

    if (!this.client) return [];
    const client = this.client;

    try {
      const { data: experiences, error } = await client
        .from('portfolio_experiences')
        .select('*')
        .order('start_date', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) {
        throw error;
      }

      const rows = (experiences ?? []) as Row[];
      const ids = rows.map((row) => String(row['id']));
      const translations = await this.getTranslations(
        client,
        'portfolio_experience_translations',
        'experience_id',
        ids,
        locale,
      );

      const result = rows
        .map((row) => {
          const translation = translations.get(String(row['id'])) ?? {};
          return {
            id: String(row['id']),
            startDate: String(row['start_date']),
            endDate: nullableString(row['end_date']),
            displayOrder: Number(row['display_order']),
            title: String(translation['title'] ?? ''),
            context: String(translation['context'] ?? ''),
            responsibilities: stringArray(translation['responsibilities']),
            technicalDecisions: stringArray(translation['technical_decisions']),
            results: stringArray(translation['results']),
          };
        })
        .sort(
          (left, right) =>
            right.startDate.localeCompare(left.startDate) || left.displayOrder - right.displayOrder,
        );
      this.errorState.set(null);
      return result;
    } catch (error) {
      this.errorState.set(toError(error));
      return [];
    }
  }

  async listProjects(locale: PortfolioLocale): Promise<PortfolioProject[]> {
    const snapshot = await this.getSnapshot();
    if (snapshot) {
      return snapshotToProjects(snapshot, locale, this.storageUrlResolver);
    }

    if (!this.client) return [];
    const client = this.client;

    try {
      const { data: projects, error } = await client
        .from('portfolio_projects')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        throw error;
      }

      const rows = (projects ?? []) as Row[];
      const ids = rows.map((row) => String(row['id']));
      const [translations, imageRows] = await Promise.all([
        this.getProjectTranslations(client, ids, locale),
        this.getProjectImages(client, ids),
      ]);

      const result = rows
        .map((row) => {
          const type = portfolioProjectType(row['project_type']);
          if (!type) return null;

          const id = String(row['id']);
          const translation = translations.get(id) ?? {};
          const images = (imageRows.get(id) ?? []).map((image) =>
            this.toProjectImage(client, image),
          );

          return {
            id,
            displayOrder: Number(row['display_order']),
            type,
            locale,
            name: String(translation['name'] ?? ''),
            description: String(translation['description'] ?? ''),
            problemContext: String(translation['problem_context'] ?? ''),
            solution: String(translation['solution'] ?? ''),
            role: String(translation['role'] ?? ''),
            technicalDecisions: stringArray(translation['technical_decisions']),
            technologies: stringArray(translation['technologies']),
            results: stringArray(translation['results']),
            learnings: stringArray(translation['learnings']),
            links: projectLinks(translation['links']),
            images,
          } satisfies PortfolioProject;
        })
        .filter((project): project is PortfolioProject => project !== null)
        .sort((left, right) => left.displayOrder - right.displayOrder);

      this.errorState.set(null);
      return result;
    } catch (error) {
      this.errorState.set(toError(error));
      return [];
    }
  }

  async getCurriculum(locale: PortfolioLocale): Promise<PortfolioFile | null> {
    const snapshot = await this.getSnapshot();
    if (snapshot) {
      const curriculum = snapshotToCurriculum(snapshot, locale, this.storageUrlResolver);
      if (curriculum) return curriculum;
    }

    if (!this.client) return null;
    const client = this.client;

    try {
      const { data, error } = await client
        .from('portfolio_files')
        .select('*')
        .eq('file_type', 'curriculum')
        .eq('locale', locale)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      const row = data as Row;
      const storagePath = String(row['storage_path'] ?? '');
      const mimeType = String(row['mime_type'] ?? '');
      if (
        row['file_type'] !== 'curriculum' ||
        row['locale'] !== locale ||
        mimeType !== 'application/pdf' ||
        storagePath.length === 0
      ) {
        this.errorState.set(new Error('Invalid curriculum metadata'));
        return null;
      }

      const publicUrl = client.storage.from('curricula').getPublicUrl(storagePath).data.publicUrl;
      if (!publicUrl) {
        this.errorState.set(new Error('Curriculum public URL unavailable'));
        return null;
      }

      return {
        id: String(row['id']),
        fileType: 'curriculum',
        locale,
        storagePath,
        originalName: String(row['original_name']),
        mimeType: 'application/pdf',
        sizeBytes: Number(row['size_bytes']),
        publicUrl,
      };
    } catch (error) {
      this.errorState.set(toError(error));
      return null;
    }
  }

  async listSkillCategories(locale: PortfolioLocale): Promise<PortfolioSkillCategory[]> {
    const snapshot = await this.getSnapshot();
    if (snapshot) {
      const categories = snapshotToSkillCategories(snapshot, locale, this.storageUrlResolver);
      if (categories.length > 0) return categories;
    }

    if (!this.client) return fallbackSkillCategories();
    const client = this.client;

    try {
      const { data: categories, error: categoriesError } = await client
        .from('portfolio_skill_categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (categoriesError) throw categoriesError;

      const categoryRows = (categories ?? []) as Row[];
      if (categoryRows.length === 0) return fallbackSkillCategories();

      const categoryIds = categoryRows.map((row) => String(row['id']));
      const [categoryTranslations, skillsResult] = await Promise.all([
        this.getLocalizedTranslations(
          client,
          'portfolio_skill_category_translations',
          'category_id',
          categoryIds,
          locale,
        ),
        client
          .from('portfolio_skills')
          .select('*')
          .in('category_id', categoryIds)
          .order('display_order', { ascending: true }),
      ]);
      if (skillsResult.error) throw skillsResult.error;

      const skillRows = (skillsResult.data ?? []) as Row[];
      const skillIds = skillRows.map((row) => String(row['id']));
      const skillTranslations = await this.getLocalizedTranslations(
        client,
        'portfolio_skill_translations',
        'skill_id',
        skillIds,
        locale,
      );
      const skillsByCategory = new Map<string, PortfolioSkill[]>();

      for (const row of skillRows) {
        const categoryId = String(row['category_id']);
        const translation = skillTranslations.get(String(row['id']));
        if (!translation) continue;
        const skills = skillsByCategory.get(categoryId) ?? [];
        const iconStoragePath = nullableString(row['icon_storage_path']);
        const iconUrl = nullableString(row['icon_url']);
        const iconPublicUrl = iconStoragePath
          ? client.storage.from('skill-icons').getPublicUrl(iconStoragePath).data.publicUrl
          : undefined;
        skills.push({
          id: String(row['id']),
          name: String(translation['name'] ?? ''),
          iconUrl: iconUrl ?? undefined,
          iconStoragePath: iconStoragePath ?? undefined,
          iconPublicUrl: iconPublicUrl || undefined,
        });
        skillsByCategory.set(categoryId, skills);
      }

      this.errorState.set(null);
      return categoryRows.map((row) => {
        const id = String(row['id']);
        const translation = categoryTranslations.get(id);
        return {
          id,
          labelKey: String(row['category_key']),
          label: translation ? String(translation['label'] ?? '') : undefined,
          skills: skillsByCategory.get(id) ?? [],
          displayOrder: Number(row['display_order']),
        };
      });
    } catch (error) {
      this.errorState.set(toError(error));
      return fallbackSkillCategories();
    }
  }

  async listAcademicEntries(locale: PortfolioLocale): Promise<PortfolioAcademicEntry[]> {
    const snapshot = await this.getSnapshot();
    if (snapshot) {
      const entries = snapshotToAcademicEntries(snapshot, locale);
      if (entries.length > 0) return entries;
    }

    if (!this.client) return fallbackAcademicEntries();
    const client = this.client;

    try {
      const { data: entries, error } = await client
        .from('portfolio_academic_entries')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;

      const rows = (entries ?? []) as Row[];
      if (rows.length === 0) return fallbackAcademicEntries();
      const ids = rows.map((row) => String(row['id']));
      const translations = await this.getLocalizedTranslations(
        client,
        'portfolio_academic_entry_translations',
        'entry_id',
        ids,
        locale,
      );

      this.errorState.set(null);
      return rows.map((row) => {
        const id = String(row['id']);
        const translation = translations.get(id);
        return {
          id,
          nameKey: id,
          name: translation ? String(translation['name'] ?? '') : undefined,
          institution: translation ? String(translation['institution'] ?? '') : '',
          startDate: nullableString(row['start_date']),
          endDate: nullableString(row['end_date']),
          isCurrent: Boolean(row['is_current']),
          competencies: translation ? stringArray(translation['competencies']) : [],
          studiedContent: translation ? stringArray(translation['studied_content']) : [],
          displayOrder: Number(row['display_order']),
        };
      });
    } catch (error) {
      this.errorState.set(toError(error));
      return fallbackAcademicEntries();
    }
  }

  async listContactLinks(locale: PortfolioLocale): Promise<PortfolioContactLink[]> {
    const snapshot = await this.getSnapshot();
    if (snapshot) {
      const contacts = snapshotToContactLinks(snapshot, locale);
      if (contacts.length > 0) return contacts;
    }

    if (!this.client) return fallbackContactLinks();
    const client = this.client;

    try {
      const { data: links, error } = await client
        .from('portfolio_contact_links')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;

      const rows = (links ?? []) as Row[];
      if (rows.length === 0) return fallbackContactLinks();
      const ids = rows.map((row) => String(row['id']));
      const translations = await this.getLocalizedTranslations(
        client,
        'portfolio_contact_link_translations',
        'contact_id',
        ids,
        locale,
      );

      this.errorState.set(null);
      return rows.flatMap((row) => {
        const symbol = contactSymbol(row['symbol']);
        if (!symbol) return [];
        const id = String(row['id']);
        const translation = translations.get(id);
        return [
          {
            id,
            labelKey: id,
            label: translation ? String(translation['label'] ?? '') : undefined,
            href: String(row['href'] ?? ''),
            symbol,
            iconPath: `/assets/contact/${symbol}.svg`,
            displayOrder: Number(row['display_order']),
          },
        ];
      });
    } catch (error) {
      this.errorState.set(toError(error));
      return fallbackContactLinks();
    }
  }

  async listSectionOrder(): Promise<string[]> {
    const snapshot = await this.getSnapshot();
    if (snapshot) {
      return snapshotToSectionOrder(snapshot);
    }
    return [
      'presentation-section',
      'about-section',
      'results-section',
      'experiences-section',
      'projects-section',
      'skills-section',
      'education-section',
      'contact-section',
    ];
  }

  private async getProjectTranslations(
    client: SupabaseClient,
    ids: string[],
    locale: PortfolioLocale,
  ): Promise<Map<string, Row>> {
    return this.getLocalizedTranslations(
      client,
      'portfolio_project_translations',
      'project_id',
      ids,
      locale,
    );
  }

  private async getLocalizedTranslations(
    client: SupabaseClient,
    table: string,
    foreignKey: string,
    ids: string[],
    locale: PortfolioLocale,
  ): Promise<Map<string, Row>> {
    const selected = await this.getTranslations(client, table, foreignKey, ids, locale);
    if (locale === 'pt-BR') return selected;

    const fallback = await this.getTranslations(client, table, foreignKey, ids, 'pt-BR');
    const merged = new Map(fallback);
    for (const [id, translation] of selected) {
      merged.set(id, translation);
    }
    return merged;
  }

  private async getTranslations(
    client: SupabaseClient,
    table: string,
    foreignKey: string,
    ids: string[],
    locale: PortfolioLocale,
  ): Promise<Map<string, Row>> {
    if (ids.length === 0) {
      return new Map();
    }

    const { data, error } = await client
      .from(table)
      .select('*')
      .in(foreignKey, ids)
      .eq('locale', locale);

    if (error) {
      throw error;
    }

    return new Map(((data ?? []) as Row[]).map((row) => [String(row[foreignKey]), row]));
  }

  private async getProjectImages(
    client: SupabaseClient,
    projectIds: string[],
  ): Promise<Map<string, Row[]>> {
    if (projectIds.length === 0) {
      return new Map();
    }

    const { data, error } = await client
      .from('portfolio_project_images')
      .select('*')
      .in('project_id', projectIds)
      .order('display_order', { ascending: true });

    if (error) {
      throw error;
    }

    const grouped = new Map<string, Row[]>();
    for (const row of (data ?? []) as Row[]) {
      const projectId = String(row['project_id']);
      const current = grouped.get(projectId) ?? [];
      current.push(row);
      grouped.set(projectId, current);
    }
    return grouped;
  }

  private toProjectImage(client: SupabaseClient, row: Row): PortfolioProjectImage {
    const storagePath = String(row['storage_path']);
    const mimeType = String(row['mime_type']);
    return {
      id: String(row['id']),
      projectId: String(row['project_id']),
      storagePath,
      originalName: String(row['original_name']),
      mimeType: mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
      sizeBytes: Number(row['size_bytes']),
      displayOrder: Number(row['display_order']),
      publicUrl: client.storage.from('project-images').getPublicUrl(storagePath).data.publicUrl,
    };
  }
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function projectLinks(value: unknown): PortfolioProjectLink[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    if (typeof row['label'] !== 'string' || typeof row['url'] !== 'string') return [];
    return [{ label: row['label'], url: row['url'] }];
  });
}

function portfolioProjectType(value: unknown): PortfolioProjectType | null {
  return value === 'professional' || value === 'personal' ? value : null;
}

function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function fallbackSkillCategories(): PortfolioSkillCategory[] {
  return PORTFOLIO_SKILL_CATEGORIES.map((category) => ({
    ...category,
    skills: category.skills.map((skill: PortfolioSkill) => ({ ...skill })),
  }));
}

function fallbackAcademicEntries(): PortfolioAcademicEntry[] {
  return PORTFOLIO_ACADEMIC_ENTRIES.map((entry) => ({ ...entry }));
}

function fallbackContactLinks(): PortfolioContactLink[] {
  return PORTFOLIO_CONTACT_LINKS.map((link) => ({ ...link }));
}

function contactSymbol(value: unknown): PortfolioContactLink['symbol'] | null {
  return value === 'linkedin' || value === 'github' || value === 'email' || value === 'phone'
    ? value
    : null;
}
