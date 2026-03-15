function calculateTotal(...numbers) {
    return numbers.reduce((total, current) => {
        if (typeof current !== 'number') {
            throw new TypeError("Invalid input: All arguments must be numbers");
        }
        return total + current;
    }, 0);
}
