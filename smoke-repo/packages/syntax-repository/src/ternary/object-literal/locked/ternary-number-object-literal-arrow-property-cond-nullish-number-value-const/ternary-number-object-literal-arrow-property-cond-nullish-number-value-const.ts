const value: number | undefined = 3;

export const ternaryNumberObjectLiteralArrowPropertyCondNullishNumberValueConst = {
    runArrow: (): string => {
        return value ?? 0 ? 'then' : 'else';
    },
};
