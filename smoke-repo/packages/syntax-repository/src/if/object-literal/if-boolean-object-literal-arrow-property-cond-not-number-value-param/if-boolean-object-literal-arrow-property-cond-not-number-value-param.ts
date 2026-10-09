export const ifBooleanObjectLiteralArrowPropertyCondNotNumberValueParam = {
    runArrow: (value: number): string => {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
