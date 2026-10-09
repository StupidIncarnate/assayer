export const ternaryBooleanObjectLiteralArrowPropertyCondNotStringValueExternal = {
    runArrow: (): string => {
        return !(process.argv[2] ?? '') ? 'then' : 'else';
    },
};
