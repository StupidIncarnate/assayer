export const ifBooleanObjectLiteralArrowPropertyCondGtStringValueParam = {
    runArrow: (value: string): string => {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    },
};
