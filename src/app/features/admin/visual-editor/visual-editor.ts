import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { PortfolioPage } from '../../portfolio/presentation/portfolio-page/portfolio-page';
import { EditorialAutosaveQueue } from '../content-management/editorial-autosave-queue';
import { EditorialCommandService } from '../content-management/editorial-command.service';
import type { EditorialPublicationValidation } from '../content-management/editorial-draft.models';
import { EditorialTextEditingDirective } from './editorial-text-editing.directive';
import { EditorialDraftContentService } from './editorial-draft-content.service';
import { PortfolioContentService } from '../../portfolio/content/portfolio-content.service';
import { EditorialStructuredEditingDirective } from './editorial-structured-editing.directive';
import { EditorialLanguageService } from './editorial-language.service';
import { PortfolioLanguageService } from '../../portfolio/content/portfolio-language.service';
import { EditorialSectionOrderingDirective } from './editorial-section-ordering.directive';
import { EditorialItemOrderingDirective } from './editorial-item-ordering.directive';
import { EditorialItemLifecycleDirective } from './editorial-item-lifecycle.directive';
import { EditorialSessionHistory } from '../content-management/editorial-session-history';
import type { EditorialHistoryItem } from '../content-management/editorial-draft.models';
import { EditorialMediaService } from '../media-management/editorial-media.service';
import {
  reviewErrorGuidance,
  reviewErrorLocation,
  reviewErrorTitle,
} from './editorial-review-errors';

@Component({
  selector: 'app-visual-editor',
  imports: [
    PortfolioPage,
    EditorialTextEditingDirective,
    EditorialStructuredEditingDirective,
    EditorialSectionOrderingDirective,
    EditorialItemOrderingDirective,
    EditorialItemLifecycleDirective,
  ],
  providers: [
    EditorialDraftContentService,
    { provide: PortfolioContentService, useExisting: EditorialDraftContentService },
    EditorialLanguageService,
    { provide: PortfolioLanguageService, useExisting: EditorialLanguageService },
  ],
  templateUrl: './visual-editor.html',
  styleUrl: './visual-editor.scss',
})
export class VisualEditor {
  protected readonly autosave = inject(EditorialAutosaveQueue);
  protected readonly sessionHistory = inject(EditorialSessionHistory);
  private readonly commands = inject(EditorialCommandService);
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  protected readonly draftContent = inject(EditorialDraftContentService);
  private readonly media = inject(EditorialMediaService);
  protected readonly preview = signal(false);
  protected readonly previewViewport = signal<'desktop' | 'mobile'>('desktop');
  protected readonly history = signal<readonly EditorialHistoryItem[]>([]);
  protected readonly validation = signal<EditorialPublicationValidation | null>(null);
  protected readonly actionError = signal('');
  protected readonly reviewErrorTitle = reviewErrorTitle;
  protected readonly reviewErrorLocation = reviewErrorLocation;
  protected readonly reviewErrorGuidance = reviewErrorGuidance;
  protected readonly publishing = signal(false);

  constructor() {
    void this.loadDraft();
    void this.loadHistory();
  }

  protected async loadHistory(): Promise<void> {
    try {
      this.history.set(await this.commands.history());
    } catch {
      this.history.set([]);
    }
  }

  private async loadDraft(): Promise<void> {
    try {
      const draft = await this.commands.loadDraft();
      this.draftContent.setDraft(draft);
      this.autosave.initialize(draft.revision);
    } catch {
      this.actionError.set('Não foi possível carregar o rascunho privado.');
    }
  }

  protected async review(): Promise<void> {
    this.actionError.set('');
    try {
      await this.autosave.flush();
      this.validation.set(
        await this.commands.validatePublication(this.autosave.confirmedRevision()),
      );
    } catch {
      this.actionError.set('Não foi possível revisar enquanto há alterações pendentes.');
    }
  }
  protected async publish(): Promise<void> {
    try {
      await this.autosave.flush();
    } catch {
      this.actionError.set('Aguarde a conclusão do salvamento ou tente novamente o autosave que falhou.');
      return;
    }
    const validation = this.validation();
    if (!validation?.valid) {
      this.actionError.set('Revise as alterações e corrija os bloqueios antes de publicar.');
      return;
    }
    if (validation.revision !== this.autosave.confirmedRevision()) {
      this.actionError.set('O rascunho mudou desde a revisão. Clique em Revisar alterações novamente.');
      this.validation.set(null);
      return;
    }
    const summary = validation.summary;
    const confirmed = confirm(
      `Publicar a revisão ${validation.revision}?\n\n` +
        `Conteúdos alterados: ${summary.changed}\n` +
        `Traduções: ${summary.translations}\n` +
        `Itens adicionados: ${summary.added}\n` +
        `Itens removidos: ${summary.removed}\n` +
        `Itens reordenados: ${summary.reordered}\n` +
        `Mídias: ${summary.media}`,
    );
    if (!confirmed) return;
    this.actionError.set('');
    this.publishing.set(true);
    try {
      await this.commands.publish(validation.revision, crypto.randomUUID(), validation.reviewHash);
      this.validation.set(null);
      await this.loadHistory();
    } catch (error) {
      if (isPublicationConsistencyError(error)) {
        this.validation.set(null);
        await this.loadDraft();
      }
      this.actionError.set(publicationErrorMessage(error));
    } finally {
      this.publishing.set(false);
    }
  }
  protected async discard(): Promise<void> {
    if (!confirm('Descartar todas as alterações privadas e restaurar a versão publicada?')) return;
    try {
      const receipt = await this.commands.discard(
        this.autosave.confirmedRevision(),
        crypto.randomUUID(),
      );
      this.autosave.initialize(receipt.revision);
      this.sessionHistory.clear();
      this.validation.set(null);
      location.reload();
    } catch {
      this.actionError.set('Não foi possível descartar as alterações.');
    }
  }
  protected async exit(): Promise<void> {
    try {
      await this.autosave.flush();
    } catch {
      return;
    }
    await this.auth.signOut();
    await this.router.navigateByUrl('/admin');
  }
  protected async retryAutosave(): Promise<void> {
    this.actionError.set('');
    try {
      await this.autosave.retry();
    } catch {
      this.actionError.set('A alteração continua apenas nesta sessão. Tente novamente.');
    }
  }
  protected chooseLocale(locale: string): void {
    this.draftContent.chooseLocale(locale);
  }
  protected async addLocale(): Promise<void> {
    const code = prompt('Código do idioma (ex.: fr-FR):')?.trim();
    const label = prompt('Nome do idioma:')?.trim();
    if (!code || !label || !/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(code) || code === 'pt-BR') return;
    try {
      await this.autosave.enqueue({
        operationId: crypto.randomUUID(),
        target: `locale.${code}`,
        command: {
          type: 'set_locale',
          code,
          label,
          status: 'preparation',
          position: this.draftContent.draft()?.locales.length ?? 0,
        },
      });
      const draft = await this.commands.loadDraft();
      this.draftContent.setDraft(draft);
    } catch {
      this.actionError.set('Não foi possível adicionar o idioma.');
    }
  }
  protected async uploadProjectImage(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const entityId = prompt('ID da entidade do projeto para associar a imagem:')?.trim();
    if (!entityId) return;
    try {
      const revision = this.autosave.confirmedRevision();
      const uploaded = await this.media.upload(revision, 'project_image', file);
      await this.media.associate(revision, entityId, uploaded.mediaId, 'projectImage');
      this.draftContent.setDraft(await this.commands.loadDraft());
    } catch {
      this.actionError.set('Não foi possível enviar e associar a imagem.');
    } finally {
      (event.target as HTMLInputElement).value = '';
    }
  }
  protected async undo(): Promise<void> {
    await this.runHistory(() => this.sessionHistory.undo(crypto.randomUUID()));
  }
  protected async redo(): Promise<void> {
    await this.runHistory(() => this.sessionHistory.redo(crypto.randomUUID()));
  }
  protected async restoreVersion(publicationId: string): Promise<void> {
    try {
      const receipt = await this.commands.restore(
        publicationId,
        this.autosave.confirmedRevision(),
        crypto.randomUUID(),
      );
      this.autosave.initialize(receipt.revision);
      this.draftContent.setDraft(await this.commands.loadDraft());
      this.validation.set(null);
      await this.loadHistory();
    } catch {
      this.actionError.set('Não foi possível restaurar essa versão como rascunho.');
    }
  }
  private async runHistory(action: () => Promise<unknown>): Promise<void> {
    this.actionError.set('');
    try {
      await this.autosave.flush();
      await action();
      this.draftContent.setDraft(await this.commands.loadDraft());
      this.validation.set(null);
    } catch {
      this.actionError.set('Não foi possível aplicar a operação ao histórico da sessão.');
    }
  }
}

function isPublicationConsistencyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as Record<string, unknown>;
  return value['code'] === '40001' || value['code'] === '21000';
}

function publicationErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'A publicação não foi confirmada. Revise novamente.';
  const value = error as Record<string, unknown>;
  if (value['code'] === '40001') return 'A revisão ficou desatualizada. Revise as alterações novamente.';
  if (value['code'] === '21000')
    return 'O servidor encontrou uma inconsistência na revisão. Atualize a página e revise novamente.';
  if (value['code'] === '42501' || value['status'] === 401 || value['status'] === 403)
    return 'Sua sessão administrativa não está autorizada a publicar. Entre novamente.';
  if (value['code'] === '22023') return 'O rascunho não passou na validação do servidor. Revise os bloqueios apresentados.';
  return 'A publicação não foi confirmada. Revise novamente.';
}
