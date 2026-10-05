import { describe, expect, it } from 'vitest';
import {
  reviewErrorGuidance,
  reviewErrorLocation,
  reviewErrorTitle,
} from './editorial-review-errors';

describe('editorial review errors', () => {
  it('explains an incomplete translation with an actionable location', () => {
    const error = {
      code: 'incomplete_locale',
      path: 'translations.en.project-1.description',
      message: 'Campo obrigatório ausente.',
    };

    expect(reviewErrorTitle(error)).toBe('Tradução incompleta');
    expect(reviewErrorLocation(error.path)).toBe(
      'Idioma: English · item: project-1 · campo: description',
    );
    expect(reviewErrorGuidance(error)).toContain('preencha o campo');
  });

  it('gives specific guidance for unsafe links and pending media', () => {
    expect(
      reviewErrorGuidance({ code: 'unsafe_url', path: 'entities/link.data.href', message: '' }),
    ).toContain('https://');
    expect(
      reviewErrorGuidance({ code: 'media_not_ready', path: 'media/abc', message: '' }),
    ).toContain('Gerenciador de mídias');
  });
});
