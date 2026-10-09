export const ternaryNumberObjectLiteralMethodCondStringLengthReceiverExternal = {
    run(): string {
        return (process.argv[2] ?? '').length ? 'then' : 'else';
    },
};
