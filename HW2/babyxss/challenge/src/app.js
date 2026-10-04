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
    // Read the HTML file
    let processedHtml;
    const filePath = path.join(__dirname, 'public', 'pages', 'index.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error loading page');
        }
        if ('q' in req.query) {
        // Process the template
        const searchQuery = req.query.q;
        processedHtml = data.replace(
            /<!-- SERVER-SIDE-TEMPLATE-START -->([\s\S]*?)<!-- SERVER-SIDE-TEMPLATE-END -->/,
            `<!-- SERVER-SIDE-TEMPLATE-START -->
        <div class="search-result">
            <h3>Search Results</h3>
            <p>No results found for: ${searchQuery}</p>
        </div>
        <!-- SERVER-SIDE-TEMPLATE-END -->`
        );
    } else {
            processedHtml = data.replace(
            /<!-- SERVER-SIDE-TEMPLATE-START -->([\s\S]*?)<!-- SERVER-SIDE-TEMPLATE-END -->/,'')
        }
        res.send(processedHtml);
    });
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

const PORT = process.env.PORT || 8399;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
});
