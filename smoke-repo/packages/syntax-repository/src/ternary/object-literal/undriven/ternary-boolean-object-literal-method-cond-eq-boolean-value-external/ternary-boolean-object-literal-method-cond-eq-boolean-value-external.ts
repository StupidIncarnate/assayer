export const ternaryBooleanObjectLiteralMethodCondEqBooleanValueExternal = {
    run(): string {
        return process.argv[2] === 'yes' === false ? 'then' : 'else';
    },
};
