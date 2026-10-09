const value: boolean | undefined = true;

export const ifBooleanObjectLiteralArrowPropertyCondNullishBooleanValueConst = {
    runArrow: (): string => {
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    },
};
