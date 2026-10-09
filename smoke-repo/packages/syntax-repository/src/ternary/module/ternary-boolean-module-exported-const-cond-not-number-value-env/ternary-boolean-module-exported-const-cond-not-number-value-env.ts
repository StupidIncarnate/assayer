const value = Number(process.env.VALUE);

export const ternaryBooleanModuleExportedConstCondNotNumberValueEnv = !value ? 'then' : 'else';
