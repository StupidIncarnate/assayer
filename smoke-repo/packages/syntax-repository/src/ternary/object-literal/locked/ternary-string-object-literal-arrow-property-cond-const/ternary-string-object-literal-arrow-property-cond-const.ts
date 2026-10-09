const cond: string = 'abc';

export const ternaryStringObjectLiteralArrowPropertyCondConst = {
    runArrow: (): string => {
        return cond ? 'then' : 'else';
    },
};
