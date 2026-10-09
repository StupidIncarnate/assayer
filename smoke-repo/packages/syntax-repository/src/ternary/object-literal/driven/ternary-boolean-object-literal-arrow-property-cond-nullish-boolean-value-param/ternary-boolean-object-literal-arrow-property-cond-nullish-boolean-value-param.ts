export const ternaryBooleanObjectLiteralArrowPropertyCondNullishBooleanValueParam = {
    runArrow: (value: boolean | undefined): string => {
        return value ?? false ? 'then' : 'else';
    },
};
