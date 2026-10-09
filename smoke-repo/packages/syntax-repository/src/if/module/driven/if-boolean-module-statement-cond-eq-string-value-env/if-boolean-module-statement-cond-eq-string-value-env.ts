const value = process.env.VALUE ?? '';

if (value === 'xyz') {
    console.log('then');
}

console.log('else');

export {};
