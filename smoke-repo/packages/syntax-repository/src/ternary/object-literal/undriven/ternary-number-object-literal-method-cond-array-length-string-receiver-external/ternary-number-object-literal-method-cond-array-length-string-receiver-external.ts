export const ternaryNumberObjectLiteralMethodCondArrayLengthStringReceiverExternal = {
    run(): string {
        return process.argv.slice(2).length ? 'then' : 'else';
    },
};
