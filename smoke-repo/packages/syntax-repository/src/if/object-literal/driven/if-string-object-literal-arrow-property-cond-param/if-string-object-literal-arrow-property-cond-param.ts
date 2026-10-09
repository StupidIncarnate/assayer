export const ifStringObjectLiteralArrowPropertyCondParam = {
    runArrow: (cond: string): string => {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
