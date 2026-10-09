const value: boolean = true;

export const ternaryBooleanObjectLiteralMethodCondNotBooleanValueConst = {
    run(): string {
        return !value ? 'then' : 'else';
    },
};
