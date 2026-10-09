export const ternaryBooleanObjectLiteralArrowPropertyCondNotStringValueParam = {
    runArrow: (value: string): string => {
        return !value ? 'then' : 'else';
    },
};
