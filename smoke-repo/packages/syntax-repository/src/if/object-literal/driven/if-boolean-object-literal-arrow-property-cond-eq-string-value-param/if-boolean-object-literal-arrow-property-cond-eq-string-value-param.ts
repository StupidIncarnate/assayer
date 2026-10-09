export const ifBooleanObjectLiteralArrowPropertyCondEqStringValueParam = {
    runArrow: (value: string): string => {
        if (value === 'xyz') {
            return 'then';
        }
        return 'else';
    },
};
