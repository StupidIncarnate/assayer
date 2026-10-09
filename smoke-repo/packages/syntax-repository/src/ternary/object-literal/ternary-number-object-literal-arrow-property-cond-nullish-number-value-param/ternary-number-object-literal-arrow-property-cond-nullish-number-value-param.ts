export const ternaryNumberObjectLiteralArrowPropertyCondNullishNumberValueParam = {
    runArrow: (value: number | undefined): string => {
        return value ?? 0 ? 'then' : 'else';
    },
};
