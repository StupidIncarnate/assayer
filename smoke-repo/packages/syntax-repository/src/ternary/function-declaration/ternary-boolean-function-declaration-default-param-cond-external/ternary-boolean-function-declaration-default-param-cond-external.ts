export function ternaryBooleanFunctionDeclarationDefaultParamCondExternal(label: string = process.argv[2] === 'yes' ? 'then' : 'else'): string {
    return label;
}
