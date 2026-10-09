const value: string = 'abc';

export const ifBooleanObjectLiteralArrowPropertyCondGtStringValueConst = {
    runArrow: (): string => {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    },
};
