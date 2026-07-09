import { contentHashContract } from './content-hash-contract';
import type { ContentHash } from './content-hash-contract';

export const ContentHashStub = (
  { value }: { value: string } = {
    value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  }
): ContentHash => contentHashContract.parse(value);
