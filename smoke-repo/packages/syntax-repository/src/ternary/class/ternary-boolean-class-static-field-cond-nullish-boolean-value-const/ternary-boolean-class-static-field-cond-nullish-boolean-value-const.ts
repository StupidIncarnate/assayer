const value: boolean | undefined = true;

export class TernaryBooleanClassStaticFieldCondNullishBooleanValueConst {
    public static label = value ?? false ? 'then' : 'else';
}
