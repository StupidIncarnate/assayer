const value: string | undefined = 'abc';

if (value ?? '') {
    console.log('then');
}

console.log('else');

export {};
