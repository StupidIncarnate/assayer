const value = process.env.VALUE === undefined ? undefined : Number(process.env.VALUE);

export const ternaryNumberModuleExportedConstCondNullishNumberValueEnv = value ?? 0 ? 'then' : 'else';
