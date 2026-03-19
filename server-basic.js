const express = require('express');
const app = express();
const PORT = 3004;

app.get('/', (req, res) => res.send('Hello World'));

app.listen(PORT, () => {
    console.log(`Basic server running at http://localhost:${PORT}`);
});
