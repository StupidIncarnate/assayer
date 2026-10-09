const cond: number = 3;

export function ifNumberFunctionDeclarationBodyCondConst(): string {
    if (cond) {
        return 'then';
    }
    return 'else';
}
