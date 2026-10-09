const value: string = 'abc';

export const ternaryBooleanObjectLiteralArrowPropertyCondEqStringValueConst = {
    runArrow: (): string => {
        return value === 'xyz' ? 'then' : 'else';
    },
};
