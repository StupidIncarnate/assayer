export const ifBooleanObjectLiteralArrowPropertyCondEqNumberValueParam = {
    runArrow: (value: number): string => {
        if (value === 7) {
            return 'then';
        }
        return 'else';
    },
};
