const value: string | undefined = 'abc';

export function ternaryStringFunctionDeclarationDefaultParamCondNullishStringValueConst(label: string = value ?? '' ? 'then' : 'else'): string {
    return label;
}
