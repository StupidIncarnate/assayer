export const ternaryBooleanObjectLiteralMethodCondNotStringValueExternal = {
    run(): string {
        return !(process.argv[2] ?? '') ? 'then' : 'else';
    },
};
