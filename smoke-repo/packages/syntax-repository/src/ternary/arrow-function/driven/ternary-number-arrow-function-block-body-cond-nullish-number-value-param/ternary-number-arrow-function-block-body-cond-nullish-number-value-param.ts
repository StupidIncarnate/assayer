export const ternaryNumberArrowFunctionBlockBodyCondNullishNumberValueParam = (value: number | undefined): string => {
    return value ?? 0 ? 'then' : 'else';
};
