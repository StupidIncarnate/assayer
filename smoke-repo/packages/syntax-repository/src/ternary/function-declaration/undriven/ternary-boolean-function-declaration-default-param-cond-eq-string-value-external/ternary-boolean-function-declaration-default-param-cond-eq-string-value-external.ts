export function ternaryBooleanFunctionDeclarationDefaultParamCondEqStringValueExternal(label: string = (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else'): string {
    return label;
}
