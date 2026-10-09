export const ternaryBooleanObjectLiteralMethodCondExternal = {
    run(): string {
        return process.argv[2] === 'yes' ? 'then' : 'else';
    },
};
