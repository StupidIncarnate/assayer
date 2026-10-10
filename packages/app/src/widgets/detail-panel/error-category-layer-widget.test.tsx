import { MantineProvider } from '#gateway/npm/mantine__core';
import { fireEvent, render } from '#gateway/npm/testing-library__react';
import { DarkSpotStub } from '@assayer/shared/contracts/dark-spot/dark-spot.stub';
import { EntryGapStub } from '@assayer/shared/contracts/entry-gap/entry-gap.stub';
import { EntrySignatureStub } from '@assayer/shared/contracts/entry-signature/entry-signature.stub';
import { FileAnalysisStub } from '@assayer/shared/contracts/file-analysis/file-analysis.stub';
import { FunctionAnalysisStub } from '@assayer/shared/contracts/function-analysis/function-analysis.stub';
import { LintEntryStub } from '@assayer/shared/contracts/lint-entry/lint-entry.stub';
import { UndrivenEntryStub } from '@assayer/shared/contracts/undriven-entry/undriven-entry.stub';

import { ErrorCategoryLayerWidget } from './error-category-layer-widget';
import { ErrorCategoryLayerWidgetProxy } from './error-category-layer-widget.proxy';
import { errorCategoryStatics } from '../../statics/error-category/error-category-statics';

describe('ErrorCategoryLayerWidget', () => {
  describe('undriven category', () => {
    it('VALID: {undriven item} => renders header, item with line number, and handles hover', () => {
      ErrorCategoryLayerWidgetProxy();
      const undriven = [UndrivenEntryStub({ name: 'inner', startLine: 3, endLine: 5 })];
      let hovered: number | null = null;

      const { getByTestId } = render(
        <ErrorCategoryLayerWidget
          category="undriven"
          items={undriven}
          hoveredLine={4}
          onLineHover={(line) => {
            hovered = line;
          }}
        />,
        { wrapper: MantineProvider },
      );

      expect(getByTestId('ERROR_GROUP_TITLE_UNDRIVEN').textContent).toBe('Undriven Errors · 1');

      const item = getByTestId('UNDRIVEN');

      expect(item.textContent).toBe('L3: inner');
      expect(item).toHaveStyle({ backgroundColor: 'var(--mantine-color-blue-9)' });

      fireEvent.mouseEnter(item);

      expect(hovered).toBe(3);

      fireEvent.mouseLeave(item);

      expect(hovered).toBe(null);
    });

    it('VALID: {click info icon} => toggles popover explanation', () => {
      ErrorCategoryLayerWidgetProxy();
      const undriven = [UndrivenEntryStub()];

      const { getByTestId, queryByTestId } = render(
        <ErrorCategoryLayerWidget category="undriven" items={undriven} />,
        { wrapper: MantineProvider },
      );

      expect(queryByTestId('ERROR_EXPLANATION_UNDRIVEN')).toBe(null);

      fireEvent.click(getByTestId('ERROR_INFO_ICON_UNDRIVEN'));

      expect(getByTestId('ERROR_EXPLANATION_UNDRIVEN').textContent).toBe(
        errorCategoryStatics.explanation.undriven,
      );
    });
  });

  describe('lints category', () => {
    it('VALID: {lint item} => renders header and lint error with line number and message', () => {
      ErrorCategoryLayerWidgetProxy();
      const lints = [LintEntryStub({ name: 'unused', message: 'nothing calls it', startLine: 10, endLine: 12 })];

      const { getByTestId } = render(
        <ErrorCategoryLayerWidget category="lints" items={lints} />,
        { wrapper: MantineProvider },
      );

      expect(getByTestId('ERROR_GROUP_TITLE_LINTS').textContent).toBe('Lint Errors · 1');
      expect(getByTestId('LINT').textContent).toBe('L10: unused — nothing calls it');
    });
  });

  describe('darkSpots category', () => {
    it('VALID: {darkSpot item} => renders header and dark spot error with line number', () => {
      ErrorCategoryLayerWidgetProxy();
      const darkSpots = [DarkSpotStub({ kind: 'ForOfStatement', startLine: 7, endLine: 9 })];

      const { getByTestId } = render(
        <ErrorCategoryLayerWidget category="darkSpots" items={darkSpots} />,
        { wrapper: MantineProvider },
      );

      expect(getByTestId('ERROR_GROUP_TITLE_DARKSPOTS').textContent).toBe('Dark Spot Errors · 1');
      expect(getByTestId('DARK_SPOT').textContent).toBe('L7: ForOfStatement');
    });
  });

  describe('gaps category', () => {
    it('VALID: {gap item with matching function line} => renders gap and highlights on function line', () => {
      ErrorCategoryLayerWidgetProxy();
      const gaps = [EntryGapStub({ name: 'loadConfig', reason: 'needs a stub' })];
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            entry: EntrySignatureStub({
              name: 'loadConfig',
              line: 15,
            }),
          }),
        ],
      });
      let hovered: number | null = null;

      const { getByTestId } = render(
        <ErrorCategoryLayerWidget
          category="gaps"
          items={gaps}
          analysis={analysis}
          hoveredLine={15}
          onLineHover={(line) => {
            hovered = line;
          }}
        />,
        { wrapper: MantineProvider },
      );

      expect(getByTestId('ERROR_GROUP_TITLE_GAPS').textContent).toBe('Gap Errors · 1');

      const item = getByTestId('RUN_GAP');

      expect(item.textContent).toBe('loadConfig — needs a stub');
      expect(item).toHaveStyle({ backgroundColor: 'var(--mantine-color-blue-9)' });

      fireEvent.mouseEnter(item);

      expect(hovered).toBe(15);
    });
  });
});
