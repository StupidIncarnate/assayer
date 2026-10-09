export const ifBooleanObjectLiteralArrowPropertyCondEqBooleanValueParam = {
    runArrow: (value: boolean): string => {
        if (value === false) {
            return 'then';
        }
        return 'else';
    },
};
