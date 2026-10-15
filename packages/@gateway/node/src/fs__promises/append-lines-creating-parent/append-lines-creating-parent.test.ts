import { appendLinesCreatingParent } from './append-lines-creating-parent';
import { appendLinesCreatingParentProxy } from './append-lines-creating-parent.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('appendLinesCreatingParent', () => {
  it('VALID: {parent missing, lines: two entries} => creates the parent then appends both lines', async () => {
    const proxy = appendLinesCreatingParentProxy();
    proxy.succeeds({ path: '/repo/.ls-pokayoke/event-outbox.jsonl' });

    await expect(
      appendLinesCreatingParent({
        path: '/repo/.ls-pokayoke/event-outbox.jsonl',
        lines: ['{"a":1}', '{"a":2}'],
      }),
    ).resolves.toBe(undefined);
    expect(proxy.appendedContentsFor({ path: '/repo/.ls-pokayoke/event-outbox.jsonl' })).toBe(
      '{"a":1}\n{"a":2}\n',
    );
  });

  it('EMPTY: {lines: []} => writes nothing and creates no directory', async () => {
    const proxy = appendLinesCreatingParentProxy();

    await expect(
      appendLinesCreatingParent({ path: '/repo/.ls-pokayoke/event-outbox.jsonl', lines: [] }),
    ).resolves.toBe(undefined);
    expect(proxy.mkdirCallsFor({ path: '/repo/.ls-pokayoke/event-outbox.jsonl' })).toStrictEqual(
      [],
    );
  });

  it('ERROR: {mkdir rejects with EACCES} => rejects without appending', async () => {
    const proxy = appendLinesCreatingParentProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/readonly/.ls-pokayoke' });
    proxy.mkdirRejects({ path: '/readonly/.ls-pokayoke/event-outbox.jsonl', error });

    await expect(
      appendLinesCreatingParent({
        path: '/readonly/.ls-pokayoke/event-outbox.jsonl',
        lines: ['{}'],
      }),
    ).rejects.toBe(error);
  });

  it('ERROR: {append rejects with EISDIR} => rejects with the raw error', async () => {
    const proxy = appendLinesCreatingParentProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/repo/.ls-pokayoke' });
    proxy.appendRejects({ path: '/repo/.ls-pokayoke', error });

    await expect(
      appendLinesCreatingParent({ path: '/repo/.ls-pokayoke', lines: ['{}'] }),
    ).rejects.toBe(error);
  });

  it('VALID: {two calls to the same path} => getCallsFor reads back each append call in order', async () => {
    const proxy = appendLinesCreatingParentProxy();
    proxy.succeeds({ path: '/repo/.ls-pokayoke/event-outbox.jsonl' });

    await appendLinesCreatingParent({
      path: '/repo/.ls-pokayoke/event-outbox.jsonl',
      lines: ['{"a":1}'],
    });
    await appendLinesCreatingParent({
      path: '/repo/.ls-pokayoke/event-outbox.jsonl',
      lines: ['{"a":2}'],
    });

    expect(proxy.getCallsFor({ path: '/repo/.ls-pokayoke/event-outbox.jsonl' })).toStrictEqual([
      ['/repo/.ls-pokayoke/event-outbox.jsonl', '{"a":1}\n', 'utf8'],
      ['/repo/.ls-pokayoke/event-outbox.jsonl', '{"a":2}\n', 'utf8'],
    ]);
  });
});
