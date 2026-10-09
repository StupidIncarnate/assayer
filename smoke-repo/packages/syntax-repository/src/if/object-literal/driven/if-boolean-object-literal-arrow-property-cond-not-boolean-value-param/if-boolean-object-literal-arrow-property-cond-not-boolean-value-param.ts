export const ifBooleanObjectLiteralArrowPropertyCondNotBooleanValueParam = {
    runArrow: (value: boolean): string => {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
