const value: number = 3;

export const ifBooleanObjectLiteralArrowPropertyCondEqNumberValueConst = {
    runArrow: (): string => {
        if (value === 7) {
            return 'then';
        }
        return 'else';
    },
};
