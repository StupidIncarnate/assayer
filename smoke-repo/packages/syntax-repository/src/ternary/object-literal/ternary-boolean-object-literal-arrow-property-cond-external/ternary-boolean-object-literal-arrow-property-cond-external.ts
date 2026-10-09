export const ternaryBooleanObjectLiteralArrowPropertyCondExternal = {
    runArrow: (): string => {
        return process.argv[2] === 'yes' ? 'then' : 'else';
    },
};
