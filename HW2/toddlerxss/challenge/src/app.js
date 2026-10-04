const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs')
const app = express();
const bot = require('./bot/bot');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/static', express.static(__dirname + '/public'));

app.use((err, req, res, next) => {
    process.exit(1);
});

/**
 * Render the Job Hunting Page
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

/**
 * recruiter will visit this page to view candidate's resume
 */
app.post('/submit', async (req, res) => {
    try {
        await bot.visit(req.body.url).catch(err => console.error('Error visiting URL:', err));
        res.send('Our agent will evaluate your resume and get back to you soon!')
    } catch (error) {
        res.send('Nice Try!')
    }
})

app.get('/search', (req, res) => {
    if (!req.query.q) {
        res.send({
            results: 'No search query provided!'
        });
        return;
    }
    const searchQuery = req.query.q;
    res.send({
        results: `No results found for: ${searchQuery}`
    });
});

const PORT = process.env.PORT || 8399;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
});
