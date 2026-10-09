const value: number = 3;

export const ifBooleanObjectLiteralArrowPropertyCondNotNumberValueConst = {
    runArrow: (): string => {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
