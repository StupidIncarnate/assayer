const value: string = 'abc';

export const ternaryBooleanObjectLiteralMethodCondNotStringValueConst = {
    run(): string {
        return !value ? 'then' : 'else';
    },
};
