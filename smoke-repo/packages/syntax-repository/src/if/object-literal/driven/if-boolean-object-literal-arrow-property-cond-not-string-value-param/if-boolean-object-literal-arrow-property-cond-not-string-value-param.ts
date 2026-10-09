export const ifBooleanObjectLiteralArrowPropertyCondNotStringValueParam = {
    runArrow: (value: string): string => {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
