import { caseSettleBroker } from './case-settle-broker';
import { caseSettleBrokerProxy } from './case-settle-broker.proxy';

describe('caseSettleBroker', () => {
  describe('values that are already final', () => {
    it('VALID: {a plain value} => true', async () => {
      caseSettleBrokerProxy();

      const result = await caseSettleBroker({ result: 'else' });

      expect(result).toBe(true);
    });

    // An array iterator is not a generator: it runs no body of the entry's, so nothing iterates it.
    it('EDGE: {an iterator that is not a generator} => true, and the iterator is left unread', async () => {
      caseSettleBrokerProxy();
      const iterator = ['then', 'else'].values();

      const result = await caseSettleBroker({ result: iterator });

      expect({ result, next: iterator.next() }).toStrictEqual({ result: true, next: { value: 'then', done: false } });
    });
  });

  describe('promises', () => {
    // An async function's exit after its first `await` runs only once its promise settles.
    it('VALID: {a promise from an async function} => awaits it, so the work after its await has run', async () => {
      caseSettleBrokerProxy();
      const log: string[] = [];
      const pending = (async (): Promise<void> => {
        await Promise.resolve();
        log.push('after await');
      })();

      const result = await caseSettleBroker({ result: pending });

      expect({ result, log }).toStrictEqual({ result: true, log: ['after await'] });
    });

    it('ERROR: {a rejected promise} => rejects with its message, so the interpreter records the throw', async () => {
      caseSettleBrokerProxy();
      const pending = (async (): Promise<void> => {
        await Promise.resolve();
        throw new TypeError('boom');
      })();

      await expect(caseSettleBroker({ result: pending })).rejects.toThrow(/^boom$/u);
    });
  });

  describe('generators', () => {
    // A generator function's call runs none of its body; iterating it runs the body to its end.
    it('VALID: {a generator} => iterates it to its end, so every statement of its body has run', async () => {
      caseSettleBrokerProxy();
      const log: string[] = [];
      const generator = (function* twoValues(): Generator<string> {
        log.push('started');
        yield 'then';
        yield 'else';
        log.push('ended');
      }());

      const result = await caseSettleBroker({ result: generator });

      expect({ result, log }).toStrictEqual({ result: true, log: ['started', 'ended'] });
    });

    it('VALID: {an async generator} => iterates it to its end', async () => {
      caseSettleBrokerProxy();
      const log: string[] = [];
      const generator = (async function* oneValueLater(): AsyncGenerator<string> {
        await Promise.resolve();
        yield 'then';
        log.push('ended');
      }());

      const result = await caseSettleBroker({ result: generator });

      expect({ result, log }).toStrictEqual({ result: true, log: ['ended'] });
    });

    it('VALID: {a promise that resolves to a generator} => awaits it, then iterates the generator to its end', async () => {
      caseSettleBrokerProxy();
      const log: string[] = [];
      const generator = (function* oneValue(): Generator<string> {
        yield 'then';
        log.push('ended');
      }());

      const result = await caseSettleBroker({ result: Promise.resolve(generator) });

      expect({ result, log }).toStrictEqual({ result: true, log: ['ended'] });
    });

    it('EMPTY: {a generator that yields no value} => true, its body having run', async () => {
      caseSettleBrokerProxy();
      const log: string[] = [];
      const generator = (function* noValue(): Generator<string> {
        log.push('ran');
        yield* [];
      }());

      const result = await caseSettleBroker({ result: generator });

      expect({ result, log }).toStrictEqual({ result: true, log: ['ran'] });
    });

    // An endless generator would hold the case open forever. It is closed, so its `finally` still runs.
    it('EDGE: {a generator that never ends} => false after the step limit, closing the generator', async () => {
      caseSettleBrokerProxy();
      const log: string[] = [];
      const generator = (function* endless(): Generator<number> {
        try {
          for (let count = 0; ; count += 1) {
            yield count;
          }
        } finally {
          log.push('closed');
        }
      }());

      const result = await caseSettleBroker({ result: generator });

      expect({ result, log }).toStrictEqual({ result: false, log: ['closed'] });
    });

    it('ERROR: {a generator whose body throws} => rejects with its message', async () => {
      caseSettleBrokerProxy();
      const generator = (function* throwsAfterOne(): Generator<string> {
        yield 'then';
        throw new TypeError('boom');
      }());

      await expect(caseSettleBroker({ result: generator })).rejects.toThrow(/^boom$/u);
    });
  });
});
