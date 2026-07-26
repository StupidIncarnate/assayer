import { templateTextContract } from './template-text-contract';
import type { TemplateText } from './template-text-contract';

export const TemplateTextStub = ({ value }: { value: string } = { value: 'id-' }): TemplateText =>
  templateTextContract.parse(value);
