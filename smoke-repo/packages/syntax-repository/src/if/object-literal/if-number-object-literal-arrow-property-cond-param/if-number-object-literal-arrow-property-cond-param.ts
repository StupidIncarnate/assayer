export const ifNumberObjectLiteralArrowPropertyCondParam = {
    runArrow: (cond: number): string => {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
