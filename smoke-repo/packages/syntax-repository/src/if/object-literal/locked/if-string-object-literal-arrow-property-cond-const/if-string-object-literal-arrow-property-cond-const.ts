const cond: string = 'abc';

export const ifStringObjectLiteralArrowPropertyCondConst = {
    runArrow: (): string => {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
