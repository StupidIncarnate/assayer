const value: string = 'abc';

export function ternaryBooleanFunctionDeclarationDefaultParamCondEqStringValueConst(label: string = value === 'xyz' ? 'then' : 'else'): string {
    return label;
}
