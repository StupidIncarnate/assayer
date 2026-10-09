export const ternaryBooleanObjectLiteralArrowPropertyCondNotBooleanValueExternal = {
    runArrow: (): string => {
        return !(process.argv[2] === 'yes') ? 'then' : 'else';
    },
};
