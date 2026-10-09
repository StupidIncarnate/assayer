const value: boolean = true;

export const ternaryBooleanObjectLiteralArrowPropertyCondNotBooleanValueConst = {
    runArrow: (): string => {
        return !value ? 'then' : 'else';
    },
};
