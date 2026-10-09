const value: string | undefined = 'abc';

export const ternaryStringObjectLiteralMethodCondNullishStringValueConst = {
    run(): string {
        return value ?? '' ? 'then' : 'else';
    },
};
