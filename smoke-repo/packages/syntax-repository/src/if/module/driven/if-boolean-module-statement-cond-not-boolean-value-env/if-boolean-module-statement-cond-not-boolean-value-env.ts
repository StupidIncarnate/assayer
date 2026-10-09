const value = process.env.VALUE === 'true';

if (!value) {
    console.log('then');
}

console.log('else');

export {};
