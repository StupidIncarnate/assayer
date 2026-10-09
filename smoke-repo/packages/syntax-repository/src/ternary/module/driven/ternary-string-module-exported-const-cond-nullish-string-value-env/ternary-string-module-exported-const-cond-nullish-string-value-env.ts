const value = process.env.VALUE === undefined ? undefined : process.env.VALUE ?? '';

export const ternaryStringModuleExportedConstCondNullishStringValueEnv = value ?? '' ? 'then' : 'else';
