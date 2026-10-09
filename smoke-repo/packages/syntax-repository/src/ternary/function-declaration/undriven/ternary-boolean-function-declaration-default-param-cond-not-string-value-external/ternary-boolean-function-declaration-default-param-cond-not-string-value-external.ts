export function ternaryBooleanFunctionDeclarationDefaultParamCondNotStringValueExternal(label: string = !(process.argv[2] ?? '') ? 'then' : 'else'): string {
    return label;
}
