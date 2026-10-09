export const ifBooleanObjectLiteralArrowPropertyCondGtNumberValueParam = {
    runArrow: (value: number): string => {
        if (value > 5) {
            return 'then';
        }
        return 'else';
    },
};
