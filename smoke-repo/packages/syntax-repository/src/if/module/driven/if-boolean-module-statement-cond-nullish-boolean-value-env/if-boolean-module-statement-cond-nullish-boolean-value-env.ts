const value = process.env.VALUE === undefined ? undefined : process.env.VALUE === 'true';

if (value ?? false) {
    console.log('then');
}

console.log('else');

export {};
