import type { EditorialSnapshotV1 } from './editorial-snapshot.models';
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
  PortfolioProjectType,
  PortfolioSkill,
  PortfolioSkillCategory,
} from './portfolio-content.models';

export function snapshotToCopy(
  snapshot: EditorialSnapshotV1,
  locale: PortfolioLocale,
): Partial<PortfolioCopy> {
  const translations = snapshot.translations[locale] ?? snapshot.translations['pt-BR'] ?? {};
  const copy: Record<string, string> = {};
  for (const [id, fields] of Object.entries(translations)) {
    if (id.startsWith('copy-')) {
      const key = id.slice(5);
      if (typeof fields['text'] === 'string') {
        copy[key] = fields['text'];
      }
    }
  }
  return copy as Partial<PortfolioCopy>;
}

export function snapshotToExperiences(
  snapshot: EditorialSnapshotV1,
  locale: PortfolioLocale,
): PortfolioExperience[] {
  return Object.entries(snapshot.entities)
    .filter(([, entity]) => entity.kind === 'experience')
    .sort((a, b) => a[1].position - b[1].position)
    .map(([id, entity]) => ({
      id,
      startDate: String(entity.data['startDate'] ?? ''),
      endDate: typeof entity.data['endDate'] === 'string' ? entity.data['endDate'] : null,
      displayOrder: entity.position,
      title: getSnapshotText(snapshot, locale, id, 'title'),
      context: getSnapshotText(snapshot, locale, id, 'context'),
      responsibilities: getSnapshotList(snapshot, locale, id, 'responsibilities'),
      technicalDecisions: getSnapshotList(snapshot, locale, id, 'technicalDecisions'),
      results: getSnapshotList(snapshot, locale, id, 'results'),
    }));
}

export function snapshotToProjects(
  snapshot: EditorialSnapshotV1,
  locale: PortfolioLocale,
  storageUrlResolver?: (bucket: string, path: string) => string,
): PortfolioProject[] {
  return Object.entries(snapshot.entities)
    .filter(([, entity]) => entity.kind === 'project')
    .sort((a, b) => a[1].position - b[1].position)
    .map(([id, entity]) => {
      const type: PortfolioProjectType =
        entity.data['type'] === 'professional' ? 'professional' : 'personal';
      const technologyIds = Array.isArray(entity.data['technologyIds'])
        ? entity.data['technologyIds'].map(String)
        : [];
      const technologies = technologyIds.map(
        (techId) => snapshot.technologies[techId]?.label ?? techId,
      );

      const links: PortfolioProjectLink[] = Object.entries(snapshot.entities)
        .filter(
          ([, linkEntity]) => linkEntity.kind === 'projectLink' && linkEntity.parentId === id,
        )
        .sort((a, b) => a[1].position - b[1].position)
        .map(([linkId, linkEntity]) => ({
          label: getSnapshotText(snapshot, locale, linkId, 'label') || 'Link',
          url: String(linkEntity.data['href'] ?? ''),
        }))
        .filter((link) => Boolean(link.url));

      const images: PortfolioProjectImage[] = Object.entries(snapshot.entities)
        .filter(
          ([, imgEntity]) => imgEntity.kind === 'projectImage' && imgEntity.parentId === id,
        )
        .sort((a, b) => a[1].position - b[1].position)
        .map(([imgId, imgEntity]) => {
          const mediaId = String(imgEntity.data['mediaId'] ?? '');
          const mediaObj = snapshot.media[mediaId];
          const assetPath = mediaObj?.assetPath ?? '';
          let publicUrl = assetPath;
          if (mediaObj?.source === 'managed' && assetPath && storageUrlResolver) {
            publicUrl = storageUrlResolver('editorial-project-images', assetPath);
          }
          return {
            id: imgId,
            projectId: id,
            storagePath: assetPath,
            originalName: String(imgEntity.data['originalName'] ?? imgId),
            mimeType: mediaObj?.mime === 'image/png' ? 'image/png' : 'image/jpeg',
            sizeBytes: mediaObj?.bytes ?? 0,
            displayOrder: imgEntity.position,
            publicUrl,
          };
        });

      return {
        id,
        displayOrder: entity.position,
        type,
        locale,
        name: getSnapshotText(snapshot, locale, id, 'name'),
        description: getSnapshotText(snapshot, locale, id, 'description'),
        problemContext: getSnapshotText(snapshot, locale, id, 'problemContext'),
        solution: getSnapshotText(snapshot, locale, id, 'solution'),
        role: getSnapshotText(snapshot, locale, id, 'role'),
        technicalDecisions: getSnapshotList(snapshot, locale, id, 'technicalDecisions'),
        technologies,
        results: getSnapshotList(snapshot, locale, id, 'results'),
        learnings: getSnapshotList(snapshot, locale, id, 'learnings'),
        links,
        images,
      };
    });
}

export function snapshotToSkillCategories(
  snapshot: EditorialSnapshotV1,
  locale: PortfolioLocale,
  storageUrlResolver?: (bucket: string, path: string) => string,
): PortfolioSkillCategory[] {
  return Object.entries(snapshot.entities)
    .filter(([, entity]) => entity.kind === 'skillCategory')
    .sort((a, b) => a[1].position - b[1].position)
    .map(([id, category]) => {
      const skills = Object.entries(snapshot.entities)
        .filter(([, skill]) => skill.kind === 'skill' && skill.parentId === id)
        .sort((a, b) => a[1].position - b[1].position)
        .map(([skillId, skill]) => {
          const techId = String(skill.data['technologyId'] ?? '');
          const tech = snapshot.technologies[techId];
          const iconMediaId = tech?.iconMediaId;
          const mediaObj = iconMediaId ? snapshot.media[iconMediaId] : undefined;
          const iconUrl = mediaObj?.assetPath;
          let iconPublicUrl: string | undefined = undefined;
          if (mediaObj?.source === 'managed' && mediaObj.assetPath && storageUrlResolver) {
            iconPublicUrl = storageUrlResolver('editorial-skill-icons', mediaObj.assetPath);
          } else if (iconUrl) {
            iconPublicUrl = iconUrl;
          }
          return {
            id: skillId.replace(/^skill-/, ''),
            name: getSnapshotText(snapshot, locale, skillId, 'name'),
            iconUrl,
            iconPublicUrl,
          } satisfies PortfolioSkill;
        });

      return {
        id,
        labelKey: '',
        label: getSnapshotText(snapshot, locale, id, 'label'),
        skills,
        displayOrder: category.position,
      } satisfies PortfolioSkillCategory;
    });
}

export function snapshotToAcademicEntries(
  snapshot: EditorialSnapshotV1,
  locale: PortfolioLocale,
): PortfolioAcademicEntry[] {
  return Object.entries(snapshot.entities)
    .filter(([, entity]) => entity.kind === 'academic')
    .sort((a, b) => a[1].position - b[1].position)
    .map(([id, entity]) => ({
      id,
      nameKey: id,
      name: getSnapshotText(snapshot, locale, id, 'name'),
      institution: getSnapshotText(snapshot, locale, id, 'institution'),
      startDate: nullableString(entity.data['startDate']),
      endDate: nullableString(entity.data['endDate']),
      isCurrent: Boolean(entity.data['isCurrent']),
      competencies: getSnapshotList(snapshot, locale, id, 'competencies'),
      studiedContent: getSnapshotList(snapshot, locale, id, 'studiedContent'),
      displayOrder: entity.position,
    }));
}

export function snapshotToContactLinks(
  snapshot: EditorialSnapshotV1,
  locale: PortfolioLocale,
): PortfolioContactLink[] {
  return Object.entries(snapshot.entities)
    .filter(([, entity]) => entity.kind === 'contact')
    .sort((a, b) => a[1].position - b[1].position)
    .flatMap(([id, entity]) => {
      const symbol = contactSymbol(entity.data['symbol']);
      if (!symbol) return [];
      return [
        {
          id,
          labelKey: id,
          label: getSnapshotText(snapshot, locale, id, 'label'),
          href: String(entity.data['href'] ?? ''),
          symbol,
          iconPath: `/assets/contact/${symbol}.svg`,
          displayOrder: entity.position,
        },
      ];
    });
}

export function snapshotToSectionOrder(snapshot: EditorialSnapshotV1): string[] {
  return snapshot.sections
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => s.id);
}

export function snapshotToCurriculum(
  snapshot: EditorialSnapshotV1,
  locale: PortfolioLocale,
  storageUrlResolver?: (bucket: string, path: string) => string,
): PortfolioFile | null {
  const entry = Object.entries(snapshot.entities).find(
    ([, e]) => e.kind === 'curriculum' && e.data['locale'] === locale,
  );
  if (!entry) return null;
  const [id, entity] = entry;
  const mediaId = String(entity.data['mediaId'] ?? '');
  const mediaObj = snapshot.media[mediaId];
  if (!mediaObj?.assetPath) return null;
  const publicUrl =
    mediaObj.source === 'managed' && storageUrlResolver
      ? storageUrlResolver('editorial-curricula', mediaObj.assetPath)
      : mediaObj.assetPath;
  return {
    id,
    fileType: 'curriculum',
    locale,
    storagePath: mediaObj.assetPath,
    originalName: String(entity.data['originalName'] ?? 'curriculum.pdf'),
    mimeType: 'application/pdf',
    sizeBytes: mediaObj.bytes,
    publicUrl,
  };
}

function getSnapshotText(
  snapshot: EditorialSnapshotV1,
  locale: string,
  id: string,
  field: string,
): string {
  return (
    snapshot.translations[locale]?.[id]?.[field] ??
    snapshot.translations['pt-BR']?.[id]?.[field] ??
    ''
  );
}

function getSnapshotList(
  snapshot: EditorialSnapshotV1,
  locale: string,
  parentId: string,
  collection: string,
): string[] {
  return Object.entries(snapshot.entities)
    .filter(
      ([, entity]) =>
        entity.kind === 'listItem' &&
        entity.parentId === parentId &&
        entity.data['collection'] === collection,
    )
    .sort((a, b) => a[1].position - b[1].position)
    .map(([id]) => getSnapshotText(snapshot, locale, id, 'text'));
}

function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function contactSymbol(value: unknown): PortfolioContactLink['symbol'] | null {
  return value === 'linkedin' || value === 'github' || value === 'email' || value === 'phone'
    ? value
    : null;
}
