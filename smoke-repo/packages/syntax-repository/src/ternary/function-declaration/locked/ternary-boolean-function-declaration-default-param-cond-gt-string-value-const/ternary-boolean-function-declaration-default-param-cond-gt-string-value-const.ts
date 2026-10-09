const value: string = 'abc';

export function ternaryBooleanFunctionDeclarationDefaultParamCondGtStringValueConst(label: string = value > 'm' ? 'then' : 'else'): string {
    return label;
}
