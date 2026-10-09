export const ternaryBooleanArrowFunctionBlockBodyCondNullishBooleanValueParam = (value: boolean | undefined): string => {
    return value ?? false ? 'then' : 'else';
};
