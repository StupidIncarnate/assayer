export const ifBooleanObjectLiteralArrowPropertyCondNullishBooleanValueParam = {
    runArrow: (value: boolean | undefined): string => {
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    },
};
