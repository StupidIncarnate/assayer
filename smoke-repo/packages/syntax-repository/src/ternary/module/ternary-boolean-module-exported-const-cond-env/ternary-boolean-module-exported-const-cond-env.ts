const cond = process.env.COND === 'true';

export const ternaryBooleanModuleExportedConstCondEnv = cond ? 'then' : 'else';
