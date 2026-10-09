const value = process.env.VALUE === undefined ? undefined : process.env.VALUE ?? '';

if (value ?? '') {
    console.log('then');
}

console.log('else');

export {};
