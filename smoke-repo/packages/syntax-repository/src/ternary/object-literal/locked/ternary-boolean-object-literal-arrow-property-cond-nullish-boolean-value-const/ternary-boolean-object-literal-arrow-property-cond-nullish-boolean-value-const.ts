const value: boolean | undefined = true;

export const ternaryBooleanObjectLiteralArrowPropertyCondNullishBooleanValueConst = {
    runArrow: (): string => {
        return value ?? false ? 'then' : 'else';
    },
};
