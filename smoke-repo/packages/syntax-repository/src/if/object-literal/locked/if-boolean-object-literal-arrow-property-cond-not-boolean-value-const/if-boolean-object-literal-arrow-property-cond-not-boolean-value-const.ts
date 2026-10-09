const value: boolean = true;

export const ifBooleanObjectLiteralArrowPropertyCondNotBooleanValueConst = {
    runArrow: (): string => {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
