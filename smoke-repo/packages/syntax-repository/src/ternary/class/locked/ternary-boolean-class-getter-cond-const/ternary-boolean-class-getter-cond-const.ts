const cond: boolean = true;

export class TernaryBooleanClassGetterCondConst {
    public get result(): string {
        return cond ? 'then' : 'else';
    }
}
