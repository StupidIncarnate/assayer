import { docsTopicContract } from './docs-topic-contract';
import type { DocsTopic } from './docs-topic-contract';

export const DocsTopicStub = ({ value }: { value: string } = { value: 'overview' }): DocsTopic =>
  docsTopicContract.parse(value);
