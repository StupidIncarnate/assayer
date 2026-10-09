const value: string = 'abc';

export class TernaryBooleanClassStaticFieldCondNotStringValueConst {
    public static label = !value ? 'then' : 'else';
}
