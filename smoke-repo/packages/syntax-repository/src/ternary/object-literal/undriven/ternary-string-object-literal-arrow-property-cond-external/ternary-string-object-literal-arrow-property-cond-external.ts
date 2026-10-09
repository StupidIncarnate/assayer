export const ternaryStringObjectLiteralArrowPropertyCondExternal = {
    runArrow: (): string => {
        return process.argv[2] ?? '' ? 'then' : 'else';
    },
};
