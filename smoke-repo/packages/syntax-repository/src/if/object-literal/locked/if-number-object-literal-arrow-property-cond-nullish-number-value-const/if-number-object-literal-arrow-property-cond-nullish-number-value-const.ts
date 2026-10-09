const value: number | undefined = 3;

export const ifNumberObjectLiteralArrowPropertyCondNullishNumberValueConst = {
    runArrow: (): string => {
        if (value ?? 0) {
            return 'then';
        }
        return 'else';
    },
};
