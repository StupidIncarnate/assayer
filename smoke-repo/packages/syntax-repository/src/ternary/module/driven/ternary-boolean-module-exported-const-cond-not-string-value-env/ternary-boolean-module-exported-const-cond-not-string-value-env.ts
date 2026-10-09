const value = process.env.VALUE ?? '';

export const ternaryBooleanModuleExportedConstCondNotStringValueEnv = !value ? 'then' : 'else';
