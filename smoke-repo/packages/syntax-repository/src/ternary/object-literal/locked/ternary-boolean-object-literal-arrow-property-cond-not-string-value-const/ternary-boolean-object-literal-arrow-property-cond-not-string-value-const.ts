const value: string = 'abc';

export const ternaryBooleanObjectLiteralArrowPropertyCondNotStringValueConst = {
    runArrow: (): string => {
        return !value ? 'then' : 'else';
    },
};
