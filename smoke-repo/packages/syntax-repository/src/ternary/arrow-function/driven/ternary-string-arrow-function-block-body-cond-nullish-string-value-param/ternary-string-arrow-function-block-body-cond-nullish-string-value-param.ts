export const ternaryStringArrowFunctionBlockBodyCondNullishStringValueParam = (value: string | undefined): string => {
    return value ?? '' ? 'then' : 'else';
};
