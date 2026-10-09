import type { StubArgument } from '@dungeonmaster/shared/@types';

import { GeneratedFileStub } from '../generated-file/generated-file.stub';
import { ManifestEntryStub } from '../manifest-entry/manifest-entry.stub';
import { RefusedSpecimenStub } from '../refused-specimen/refused-specimen.stub';
import { generationResultContract } from './generation-result-contract';
import type { GenerationResult } from './generation-result-contract';

export const GenerationResultStub = ({ ...props }: StubArgument<GenerationResult> = {}): GenerationResult =>
  generationResultContract.parse({
    files: [GeneratedFileStub()],
    refused: [RefusedSpecimenStub()],
    manifest: [ManifestEntryStub()],
    ...props,
  });
