const value: boolean = true;

export class TernaryBooleanClassStaticFieldCondNotBooleanValueConst {
    public static label = !value ? 'then' : 'else';
}
