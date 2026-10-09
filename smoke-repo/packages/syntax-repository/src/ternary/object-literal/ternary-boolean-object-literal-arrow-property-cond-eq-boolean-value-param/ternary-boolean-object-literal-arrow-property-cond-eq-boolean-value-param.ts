export const ternaryBooleanObjectLiteralArrowPropertyCondEqBooleanValueParam = {
    runArrow: (value: boolean): string => {
        return value === false ? 'then' : 'else';
    },
};
