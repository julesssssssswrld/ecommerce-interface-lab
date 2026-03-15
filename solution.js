function generateIDs(count) {
    const ids = [];
    for (let i = 0; i < count; i++) {
        if (i === 5) {
            continue;
        }
        ids.push(`ID-${i}`);
    }
    return ids;
}
