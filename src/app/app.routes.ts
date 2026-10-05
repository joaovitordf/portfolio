import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/auth/admin-auth.guard';
import { AdminWorkspace } from './features/admin/admin-page/admin-workspace';
import { AdminAuthentication } from './features/admin/authentication/admin-authentication';
import { PortfolioPage } from './features/portfolio/presentation/portfolio-page/portfolio-page';
import { PortfolioContentService } from './features/portfolio/content/portfolio-content.service';
import { PublishedSnapshotContentService } from './features/portfolio/content/published-snapshot-content.service';

export const routes: Routes = [
  {
    path: 'projetos/:id',
    providers: [{ provide: PortfolioContentService, useClass: PublishedSnapshotContentService }],
    loadComponent: () =>
      import('./features/portfolio/presentation/projects/project-detail').then(
        (m) => m.ProjectDetail,
      ),
  },
  {
    path: 'projetos/:id',
    providers: [{ provide: PortfolioContentService, useClass: PublishedSnapshotContentService }],
    loadComponent: () =>
      import('./features/portfolio/presentation/projects/project-detail').then(
        (m) => m.ProjectDetail,
      ),
  },
  {
    path: '',
    component: PortfolioPage,
    providers: [{ provide: PortfolioContentService, useClass: PublishedSnapshotContentService }],
    pathMatch: 'full',
  },
  {
    path: 'admin/editor',
    canMatch: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/visual-editor/visual-editor').then((m) => m.VisualEditor),
  },
  {
    path: 'admin/media',
    canMatch: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/media-management/media-management').then(
        (m) => m.MediaManagement,
      ),
  },
  {
    path: 'admin/editor/projetos/:id',
    canMatch: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/visual-editor/editorial-project-detail').then(
        (m) => m.EditorialProjectDetail,
      ),
  },
  { path: 'admin', component: AdminWorkspace, canMatch: [adminAuthGuard] },
  { path: 'admin', component: AdminAuthentication },
  { path: '**', redirectTo: '' },
];
