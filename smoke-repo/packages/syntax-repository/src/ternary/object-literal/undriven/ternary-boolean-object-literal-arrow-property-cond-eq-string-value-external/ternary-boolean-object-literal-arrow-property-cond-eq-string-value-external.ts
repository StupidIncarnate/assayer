export const ternaryBooleanObjectLiteralArrowPropertyCondEqStringValueExternal = {
    runArrow: (): string => {
        return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
    },
};
