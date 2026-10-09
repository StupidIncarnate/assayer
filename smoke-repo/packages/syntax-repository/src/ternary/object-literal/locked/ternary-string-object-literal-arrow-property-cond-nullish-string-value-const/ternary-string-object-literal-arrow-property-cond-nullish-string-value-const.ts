const value: string | undefined = 'abc';

export const ternaryStringObjectLiteralArrowPropertyCondNullishStringValueConst = {
    runArrow: (): string => {
        return value ?? '' ? 'then' : 'else';
    },
};
