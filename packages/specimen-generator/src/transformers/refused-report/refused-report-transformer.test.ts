import { RefusedSpecimenStub } from '../../contracts/refused-specimen/refused-specimen.stub';
import { refusedReportTransformer } from './refused-report-transformer';

describe('refusedReportTransformer', () => {
  it('EMPTY: {refused: []} => says None.', () => {
    const result = refusedReportTransformer({ refused: [] });

    expect(result).toBe(
      [
        '# Specimens TypeScript refused',
        '',
        "The generator does not write a specimen that TypeScript rejects, and lists it here with TypeScript's reason.",
        '',
        'None.',
        '',
      ].join('\n'),
    );
  });

  it('VALID: {one refused specimen} => lists the folder and the reason', () => {
    const refused = [RefusedSpecimenStub({ folder: 'if-number-class-body-cond-param', reason: 'Type error one.' })];

    const result = refusedReportTransformer({ refused });

    expect(result).toBe(
      [
        '# Specimens TypeScript refused',
        '',
        "The generator does not write a specimen that TypeScript rejects, and lists it here with TypeScript's reason.",
        '',
        '- `if-number-class-body-cond-param`: Type error one.',
        '',
      ].join('\n'),
    );
  });

  it('VALID: {three refused specimens out of order} => lists them sorted by folder', () => {
    const refused = [
      RefusedSpecimenStub({ folder: 'b-folder', reason: 'Reason b.' }),
      RefusedSpecimenStub({ folder: 'c-folder', reason: 'Reason c.' }),
      RefusedSpecimenStub({ folder: 'a-folder', reason: 'Reason a.' }),
    ];

    const result = refusedReportTransformer({ refused });

    expect(result).toBe(
      [
        '# Specimens TypeScript refused',
        '',
        "The generator does not write a specimen that TypeScript rejects, and lists it here with TypeScript's reason.",
        '',
        '- `a-folder`: Reason a.',
        '- `b-folder`: Reason b.',
        '- `c-folder`: Reason c.',
        '',
      ].join('\n'),
    );
  });

  it('EDGE: {two entries with the same folder} => keeps both lines', () => {
    const refused = [
      RefusedSpecimenStub({ folder: 'same', reason: 'First.' }),
      RefusedSpecimenStub({ folder: 'same', reason: 'Second.' }),
    ];

    const result = refusedReportTransformer({ refused });

    expect(result).toBe(
      [
        '# Specimens TypeScript refused',
        '',
        "The generator does not write a specimen that TypeScript rejects, and lists it here with TypeScript's reason.",
        '',
        '- `same`: First.',
        '- `same`: Second.',
        '',
      ].join('\n'),
    );
  });
});
