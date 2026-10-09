const cond: number = 3;

export class TernaryNumberClassGetterCondConst {
    public get result(): string {
        return cond ? 'then' : 'else';
    }
}
