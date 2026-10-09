export class IfBooleanClassGetterCondNotBooleanValueExternal {
    public get result(): string {
        if (!(process.argv[2] === 'yes')) {
            return 'then';
        }
        return 'else';
    }
}
