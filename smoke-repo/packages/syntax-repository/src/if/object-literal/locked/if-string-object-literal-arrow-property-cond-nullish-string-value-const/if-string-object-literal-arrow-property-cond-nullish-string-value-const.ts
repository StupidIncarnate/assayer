const value: string | undefined = 'abc';

export const ifStringObjectLiteralArrowPropertyCondNullishStringValueConst = {
    runArrow: (): string => {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    },
};
