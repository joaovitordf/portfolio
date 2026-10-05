import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { AdminAuthErrorCode } from '../../../core/auth/admin-auth.models';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';

const ERROR_MESSAGE = 'Não foi possível autenticar. Verifique os dados e tente novamente.';

@Component({
  selector: 'app-admin-authentication',
  imports: [FormsModule],
  templateUrl: './admin-authentication.html',
  styleUrl: './admin-authentication.scss',
})
export class AdminAuthentication {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');

  constructor() {
    void this.restoreSession();
  }

  protected async submit(): Promise<void> {
    if (!this.email().trim() || !this.password()) {
      this.errorMessage.set(ERROR_MESSAGE);
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    const result = await this.auth.signIn(this.email().trim(), this.password());
    this.submitting.set(false);

    if (!result.ok) {
      this.errorMessage.set(this.messageFor(result.code));
      return;
    }

    await this.router.navigateByUrl('/', { skipLocationChange: true });
    await this.router.navigate(['/admin']);
  }

  private async restoreSession(): Promise<void> {
    if (await this.auth.restoreAuthorizedSession()) {
      await this.router.navigateByUrl('/', { skipLocationChange: true });
      await this.router.navigate(['/admin']);
    }
  }

  private messageFor(_code: AdminAuthErrorCode): string {
    return ERROR_MESSAGE;
  }
}
