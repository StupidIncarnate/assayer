const value: string | undefined = 'abc';

export function ternaryStringFunctionDeclarationBodyCondNullishStringValueConst(): string {
    return value ?? '' ? 'then' : 'else';
}
