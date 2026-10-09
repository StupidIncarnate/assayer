export const ternaryBooleanObjectLiteralArrowPropertyCondNotBooleanValueParam = {
    runArrow: (value: boolean): string => {
        return !value ? 'then' : 'else';
    },
};
