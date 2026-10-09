export const ternaryBooleanObjectLiteralArrowPropertyCondEqBooleanValueExternal = {
    runArrow: (): string => {
        return process.argv[2] === 'yes' === false ? 'then' : 'else';
    },
};
