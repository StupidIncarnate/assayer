const cond: string = 'abc';

export function ifStringFunctionDeclarationBodyCondConst(): string {
    if (cond) {
        return 'then';
    }
    return 'else';
}
