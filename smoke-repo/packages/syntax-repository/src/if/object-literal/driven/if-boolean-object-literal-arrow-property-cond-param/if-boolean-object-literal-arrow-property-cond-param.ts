export const ifBooleanObjectLiteralArrowPropertyCondParam = {
    runArrow: (cond: boolean): string => {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
