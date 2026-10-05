import { describe, expect, it } from 'vitest';

import snapshotArtifact from '../../../../../spec/05-verificacao/ativacao-painel-admin-joao-vitor/initial-editorial-snapshot-joao-v1.json';
import { validateEditorialSnapshot } from './editorial-snapshot.validator';

describe('snapshot editorial inicial de João Vitor', () => {
  const snapshot = snapshotArtifact as unknown as Record<string, unknown>;

  it('passa pelo validador v1 usado pelo cliente', () => {
    const result = validateEditorialSnapshot(snapshot);
    if (!result.valid) {
      console.error(result.issues);
    }
    expect(result.valid).toBe(true);
  });

  it('contém as experiências e projetos de João Vitor sem dados de terceiros', () => {
    const raw = JSON.stringify(snapshot);
    expect(raw).not.toContain('Marcos');
    expect(raw).not.toContain('Alvoar');
    expect(raw).not.toContain('DocFlow');
    expect(raw).toContain('João Vitor');
    expect(raw).toContain('SensorEng');
    expect(raw).toContain('Russian Mastery');
  });
});
