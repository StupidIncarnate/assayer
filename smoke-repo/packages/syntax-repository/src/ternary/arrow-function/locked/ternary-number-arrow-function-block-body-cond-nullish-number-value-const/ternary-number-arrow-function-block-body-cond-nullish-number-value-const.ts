const value: number | undefined = 3;

export const ternaryNumberArrowFunctionBlockBodyCondNullishNumberValueConst = (): string => {
    return value ?? 0 ? 'then' : 'else';
};
