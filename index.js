const express = require('express');
const hbs = require('express-hbs');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;
const prod = process.env.PRODUCTION || true;

const fs = require('fs');
const filePath = 'data.txt';
const fsWrite = fs.createWriteStream(filePath, {
    flags: 'a'
});

const parser = bodyParser.urlencoded({
    extended: false,
    parameterLimit: 2 // msg, tags
});

const readline = require('readline');
readline.createInterface({
    input: fs.createReadStream('data.txt')
}).on('line', line => {
    data.lines.push(line);
});

app.engine('hbs', hbs.express4({
    partialsDir: `${__dirname}/views/partials`,
    layoutsDir: `${__dirname}/views/layouts`
}));
app.set('view engine', 'hbs');
app.set('views', `${__dirname}/views`);

const data = {
    title: 'Pickup-EECS',
    prod: prod,
    lines: []
};

const selectRandomLine = () => {
    return data.lines[Math.floor(Math.random() * data.lines.length)];
};

app.get('/', (req, res) => {
    res.render('index', {
        title: data.title,
        message: selectRandomLine()
    });
});

app.get('/api', (req, res) => {
    res.send(selectRandomLine());
});

app.get('/add', (req, res) => {
    res.render('add', {
        title: `${data.title} - Add`
    });
});

app.post('/add', parser, (req, res) => {
    if (data.lines.includes(req.body.msg)) {
        res.sendStatus(409);
        return;
    }
    // validate the line
    // should be only one line long (no newline characters)
    // should have none of the following characters: .?!
    if (req.body.msg.match(/\n/gi) || req.body.msg.match(/\.|\?|!/gi)) {
        res.sendStatus(400);
        return;
    }
    const msg = `${req.body.msg}\t${JSON.stringify(req.body.tags.split(' '))}`;
    console.log(`Writing ${msg}`);
    data.lines.push(req.body.msg);
    fsWrite.write(`\n${msg}`);
    res.sendStatus(201);
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
