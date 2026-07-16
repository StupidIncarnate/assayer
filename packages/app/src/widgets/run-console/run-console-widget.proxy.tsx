/**
 * The widget takes everything it renders as props and calls no binding, so there is nothing to mock:
 * the empty proxy exists to satisfy the create-a-proxy rule and to keep the test shape uniform.
 */
export const RunConsoleWidgetProxy = (): Record<PropertyKey, never> => ({});
