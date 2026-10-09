export const ifStringObjectLiteralArrowPropertyCondNullishStringValueParam = {
    runArrow: (value: string | undefined): string => {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    },
};
