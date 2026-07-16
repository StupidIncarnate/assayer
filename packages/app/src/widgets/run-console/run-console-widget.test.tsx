import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { RunConsoleStub } from '../../contracts/run-console/run-console.stub';
import { RunConsoleWidget } from './run-console-widget';
import { RunConsoleWidgetProxy } from './run-console-widget.proxy';

describe('RunConsoleWidget', () => {
  describe('with CLI output', () => {
    // The CLI's report is shown VERBATIM. The panel and a human typing `assayer unit` must not be
    // able to disagree about what happened, so the bytes are not re-rendered or summarised.
    it('VALID: {the CLI report} => the text is shown exactly as the CLI wrote it', () => {
      RunConsoleWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: (
          <RunConsoleWidget
            output={RunConsoleStub({ value: 'Assayer is updating caches\na.ts  3/3 passed\n' })}
            running={false}
            onHide={(): void => undefined}
          />
        ),
      });

      expect(getByTestId('RUN_CONSOLE_OUTPUT').textContent).toBe(
        'Assayer is updating caches\na.ts  3/3 passed\n',
      );
    });

    it('VALID: {a finished run} => the panel says so rather than leaving the reader to guess', () => {
      RunConsoleWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <RunConsoleWidget output={RunConsoleStub()} running={false} onHide={(): void => undefined} />,
      });

      expect(getByTestId('RUN_CONSOLE_STATUS').textContent).toBe('Finished');
    });

    // A report that has stopped writing and one still being written look identical. Saying which is
    // the entire job of this line — its absence is the spinning-forever failure in another costume.
    it('VALID: {a run in flight} => the panel states it is still running', () => {
      RunConsoleWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <RunConsoleWidget output={RunConsoleStub()} running onHide={(): void => undefined} />,
      });

      expect(getByTestId('RUN_CONSOLE_STATUS').textContent).toBe('Running…');
    });
  });

  describe('before the CLI has written anything', () => {
    it('EMPTY: {no output yet} => says it is waiting rather than rendering a blank panel', () => {
      RunConsoleWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <RunConsoleWidget output={RunConsoleStub({ value: '' })} running onHide={(): void => undefined} />,
      });

      expect(getByTestId('RUN_CONSOLE_EMPTY').textContent).toBe('Waiting for the CLI…');
    });
  });

  describe('a run that could not happen', () => {
    // The run never got far enough to write a report, so the panel would otherwise be empty for a
    // failure the reader most needs to see.
    it('ERROR: {the run threw} => the reason is shown in the console', () => {
      RunConsoleWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: (
          <RunConsoleWidget
            output={RunConsoleStub({ value: '' })}
            running={false}
            error={new Error('assayer: the CLI is not built, so nothing can be run.')}
            onHide={(): void => undefined}
          />
        ),
      });

      expect(getByTestId('RUN_CONSOLE_ERROR').textContent).toBe(
        'assayer: the CLI is not built, so nothing can be run.',
      );
    });
  });

  describe('hiding the panel', () => {
    it('VALID: {click the hide control} => asks the caller to hide it', () => {
      RunConsoleWidgetProxy();
      const hidden: ReturnType<typeof RunConsoleStub>[] = [];

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: (
          <RunConsoleWidget
            output={RunConsoleStub()}
            running={false}
            onHide={(): void => {
              hidden.push(RunConsoleStub({ value: 'hidden' }));
            }}
          />
        ),
      });
      getByTestId('RUN_CONSOLE_HIDE').click();

      expect(hidden.map((entry) => String(entry))).toStrictEqual(['hidden']);
    });
  });
});
