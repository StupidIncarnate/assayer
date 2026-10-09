export const ternaryNumberObjectLiteralMethodCondArrayLengthBooleanReceiverExternal = {
    run(): string {
        return process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
    },
};
