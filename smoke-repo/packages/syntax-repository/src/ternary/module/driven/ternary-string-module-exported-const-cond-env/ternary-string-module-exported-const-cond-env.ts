const cond = process.env.COND ?? '';

export const ternaryStringModuleExportedConstCondEnv = cond ? 'then' : 'else';
