const value: boolean = true;

export class TernaryBooleanClassFieldCondNotBooleanValueConst {
    public label = !value ? 'then' : 'else';
}
