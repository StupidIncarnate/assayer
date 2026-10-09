export const ifBooleanObjectLiteralMethodCondNotBooleanValueExternal = {
    run(): string {
        if (!(process.argv[2] === 'yes')) {
            return 'then';
        }
        return 'else';
    },
};
