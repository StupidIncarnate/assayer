const value: string | undefined = 'abc';

export const ifStringObjectLiteralMethodCondNullishStringValueConst = {
    run(): string {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    },
};
