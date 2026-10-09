import { drainGeneratorLayerBroker } from './drain-generator-layer-broker';
import { drainGeneratorLayerBrokerProxy } from './drain-generator-layer-broker.proxy';

describe('drainGeneratorLayerBroker', () => {
  describe('generators that end', () => {
    it('VALID: {a generator with two values} => true once done, every value read', async () => {
      drainGeneratorLayerBrokerProxy();
      const log: string[] = [];
      const generator = (function* twoValues(): Generator<string> {
        yield 'then';
        log.push('after then');
        yield 'else';
        log.push('after else');
      }());

      const result = await drainGeneratorLayerBroker({ generator, step: 0 });

      expect({ result, log }).toStrictEqual({ result: true, log: ['after then', 'after else'] });
    });

    it('VALID: {an async generator} => true once done', async () => {
      drainGeneratorLayerBrokerProxy();
      const log: string[] = [];
      const generator = (async function* oneValueThenAwait(): AsyncGenerator<string> {
        yield 'then';
        await Promise.resolve();
        log.push('ended');
      }());

      const result = await drainGeneratorLayerBroker({ generator, step: 0 });

      expect({ result, log }).toStrictEqual({ result: true, log: ['ended'] });
    });

    it('EMPTY: {a generator that yields no value} => true', async () => {
      drainGeneratorLayerBrokerProxy();
      const generator = (function* noValue(): Generator<string> {
        yield* [];
      }());

      const result = await drainGeneratorLayerBroker({ generator, step: 0 });

      expect(result).toBe(true);
    });
  });

  describe('the step limit', () => {
    // A step count already at the limit reads no further value: it closes the generator and says so.
    it('EDGE: {step already at the limit} => false, closing the generator without reading a value', async () => {
      drainGeneratorLayerBrokerProxy();
      const log: string[] = [];
      const generator = (function* closable(): Generator<string> {
        try {
          log.push('started');
          yield 'then';
        } finally {
          log.push('closed');
        }
      }());
      generator.next();

      const result = await drainGeneratorLayerBroker({ generator, step: 10000 });

      expect({ result, log }).toStrictEqual({ result: false, log: ['started', 'closed'] });
    });

    it('EDGE: {one step below the limit, the generator still yielding} => false after reading one more value', async () => {
      drainGeneratorLayerBrokerProxy();
      const log: string[] = [];
      const generator = (function* twoValues(): Generator<string> {
        yield 'then';
        log.push('after then');
        yield 'else';
        log.push('after else');
      }());

      const result = await drainGeneratorLayerBroker({ generator, step: 9999 });

      expect({ result, log }).toStrictEqual({ result: false, log: [] });
    });
  });
});
