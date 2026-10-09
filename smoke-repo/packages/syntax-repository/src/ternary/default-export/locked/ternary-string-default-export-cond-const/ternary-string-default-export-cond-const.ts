const cond: string = 'abc';

const ternaryStringDefaultExportCondConst = (): string => {
    return cond ? 'then' : 'else';
};

export default ternaryStringDefaultExportCondConst;
