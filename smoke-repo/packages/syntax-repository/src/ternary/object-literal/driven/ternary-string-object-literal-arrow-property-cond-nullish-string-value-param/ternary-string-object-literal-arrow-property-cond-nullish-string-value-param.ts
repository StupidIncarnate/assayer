export const ternaryStringObjectLiteralArrowPropertyCondNullishStringValueParam = {
    runArrow: (value: string | undefined): string => {
        return value ?? '' ? 'then' : 'else';
    },
};
