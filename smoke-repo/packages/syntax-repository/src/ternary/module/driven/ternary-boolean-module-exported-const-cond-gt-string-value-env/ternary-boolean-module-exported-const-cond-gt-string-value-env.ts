const value = process.env.VALUE ?? '';

export const ternaryBooleanModuleExportedConstCondGtStringValueEnv = value > 'm' ? 'then' : 'else';
