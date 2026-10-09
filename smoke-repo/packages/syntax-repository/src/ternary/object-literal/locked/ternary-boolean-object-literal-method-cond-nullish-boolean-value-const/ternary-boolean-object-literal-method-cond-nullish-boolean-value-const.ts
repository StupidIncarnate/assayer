const value: boolean | undefined = true;

export const ternaryBooleanObjectLiteralMethodCondNullishBooleanValueConst = {
    run(): string {
        return value ?? false ? 'then' : 'else';
    },
};
