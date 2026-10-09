const value: string = 'abc';

export const ifBooleanObjectLiteralArrowPropertyCondEqStringValueConst = {
    runArrow: (): string => {
        if (value === 'xyz') {
            return 'then';
        }
        return 'else';
    },
};
