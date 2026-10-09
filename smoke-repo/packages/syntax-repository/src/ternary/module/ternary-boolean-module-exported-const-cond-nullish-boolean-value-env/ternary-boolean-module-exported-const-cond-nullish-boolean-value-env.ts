const value = process.env.VALUE === undefined ? undefined : process.env.VALUE === 'true';

export const ternaryBooleanModuleExportedConstCondNullishBooleanValueEnv = value ?? false ? 'then' : 'else';
