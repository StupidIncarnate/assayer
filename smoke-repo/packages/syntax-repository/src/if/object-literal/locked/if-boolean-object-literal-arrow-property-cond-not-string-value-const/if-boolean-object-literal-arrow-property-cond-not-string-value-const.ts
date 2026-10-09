const value: string = 'abc';

export const ifBooleanObjectLiteralArrowPropertyCondNotStringValueConst = {
    runArrow: (): string => {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
