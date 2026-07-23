// The shell has no bindings or brokers — it is pure layout over react-router's Outlet — so its proxy
// mocks nothing. Present for enforce-implementation-colocation.
export const AppShellWidgetProxy = (): Record<PropertyKey, never> => ({});
