export const ternaryBooleanObjectLiteralMethodCondEqStringValueExternal = {
    run(): string {
        return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
    },
};
