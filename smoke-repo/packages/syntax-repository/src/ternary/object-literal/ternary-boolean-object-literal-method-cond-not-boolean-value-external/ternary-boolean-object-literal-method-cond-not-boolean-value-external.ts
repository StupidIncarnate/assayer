export const ternaryBooleanObjectLiteralMethodCondNotBooleanValueExternal = {
    run(): string {
        return !(process.argv[2] === 'yes') ? 'then' : 'else';
    },
};
