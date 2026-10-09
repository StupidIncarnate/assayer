const value = process.env.VALUE === 'true';

export const ternaryBooleanModuleExportedConstCondNotBooleanValueEnv = !value ? 'then' : 'else';
