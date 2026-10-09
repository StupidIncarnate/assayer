export function ternaryBooleanFunctionDeclarationDefaultParamCondNotBooleanValueExternal(label: string = !(process.argv[2] === 'yes') ? 'then' : 'else'): string {
    return label;
}
