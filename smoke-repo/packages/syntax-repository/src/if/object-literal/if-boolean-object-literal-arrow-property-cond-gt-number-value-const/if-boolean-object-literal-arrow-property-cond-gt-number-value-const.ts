const value: number = 3;

export const ifBooleanObjectLiteralArrowPropertyCondGtNumberValueConst = {
    runArrow: (): string => {
        if (value > 5) {
            return 'then';
        }
        return 'else';
    },
};
