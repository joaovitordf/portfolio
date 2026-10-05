import type { EditorialPublicationValidation } from '../content-management/editorial-draft.models';

export type EditorialReviewError = EditorialPublicationValidation['errors'][number];

export function reviewErrorTitle(error: EditorialReviewError): string {
  switch (error.code) {
    case 'incomplete_locale':
      return 'Tradução incompleta';
    case 'unsafe_url':
      return 'Link bloqueado';
    case 'media_not_ready':
      return 'Mídia ainda não está pronta';
    default:
      return 'Conteúdo precisa de correção';
  }
}

export function reviewErrorGuidance(error: EditorialReviewError): string {
  switch (error.code) {
    case 'incomplete_locale':
      return 'Abra o idioma e preencha o campo indicado antes de revisar novamente.';
    case 'unsafe_url':
      return 'Edite o link para começar com https://, mailto: ou tel:.';
    case 'media_not_ready':
      return 'Aguarde o processamento da mídia ou envie o arquivo novamente pelo Gerenciador de mídias.';
    default:
      return 'Corrija o item indicado e clique em Revisar alterações novamente.';
  }
}

export function reviewErrorLocation(path: string): string {
  const safePath = path || 'não informado';
  const parts = safePath.split('.');
  if (parts[0] === 'translations' && parts.length >= 4) {
    return `Idioma: ${localeLabel(parts[1])} · item: ${parts[2]} · campo: ${parts.slice(3).join('.')}`;
  }
  if (parts[0] === 'entities' && parts.length >= 3) {
    return `Item: ${parts[1]} · campo: ${parts.slice(2).join('.')}`;
  }
  if (parts[0] === 'media' && parts[1]) return `Mídia: ${parts.slice(1).join('.')}`;
  return `Local: ${safePath}`;
}

function localeLabel(code: string): string {
  switch (code) {
    case 'pt-BR':
      return 'Português';
    case 'en':
      return 'English';
    default:
      return code;
  }
}
