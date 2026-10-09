const value = process.env.VALUE ?? '';

export const ternaryBooleanModuleExportedConstCondEqStringValueEnv = value === 'xyz' ? 'then' : 'else';
