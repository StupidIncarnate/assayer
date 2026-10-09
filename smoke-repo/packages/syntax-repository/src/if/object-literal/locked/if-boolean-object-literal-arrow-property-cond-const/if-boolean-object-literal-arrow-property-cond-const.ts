const cond: boolean = true;

export const ifBooleanObjectLiteralArrowPropertyCondConst = {
    runArrow: (): string => {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
