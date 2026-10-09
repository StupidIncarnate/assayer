const value = process.env.VALUE === 'true';

export const ternaryBooleanModuleExportedConstCondEqBooleanValueEnv = value === false ? 'then' : 'else';
