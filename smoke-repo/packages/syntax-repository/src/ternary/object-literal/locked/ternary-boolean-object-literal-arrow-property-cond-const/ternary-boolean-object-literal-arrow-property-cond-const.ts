const cond: boolean = true;

export const ternaryBooleanObjectLiteralArrowPropertyCondConst = {
    runArrow: (): string => {
        return cond ? 'then' : 'else';
    },
};
