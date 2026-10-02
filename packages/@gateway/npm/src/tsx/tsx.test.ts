import { tsxLoaderUrl as directLoaderUrl } from './tsx-loader-url/tsx-loader-url';
import { tsxLoaderUrl } from './tsx';

describe('#gateway/npm/tsx', () => {
  it('VALID: {module} => exports the same function the folder holds', () => {
    expect({ tsxLoaderUrl }).toStrictEqual({ tsxLoaderUrl: directLoaderUrl });
  });
});
