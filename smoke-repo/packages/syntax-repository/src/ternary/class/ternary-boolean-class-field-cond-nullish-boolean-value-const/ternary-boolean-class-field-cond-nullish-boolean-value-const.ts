const value: boolean | undefined = true;

export class TernaryBooleanClassFieldCondNullishBooleanValueConst {
    public label = value ?? false ? 'then' : 'else';
}
