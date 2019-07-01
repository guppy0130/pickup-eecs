const express = require('express');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const sass = require('node-sass-middleware');

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
    let info = line.split('\t');
    data.lines.push({
        msg: info[0],
        tags: info[1]
    });
});

app.engine('.hbs', hbs({
    extname: '.hbs'
}));
app.set('view engine', '.hbs');

app.use(sass({
    src: `${__dirname}/styles`,
    dest: `${__dirname}/styles`,
    outputStyle: 'compressed',
    prefix: '/styles'
}));

app.use('/styles', express.static(`${__dirname}/styles`));

const data = {
    title: 'Pickup-EECS',
    prod: prod,
    lines: []
};

const selectRandomLine = () => {
    let msg = data.lines[Math.floor(Math.random() * data.lines.length)];
    while (msg.msg === '') {
        msg = data.lines[Math.floor(Math.random() * data.lines.length)];
    }
    return msg;
};

app.get('/', (req, res) => {
    let msg = selectRandomLine();
    res.render('index', {
        title: data.title,
        message: msg.msg,
        tags: msg.tags
    });
});

app.get('/api', (req, res) => {
    res.json(selectRandomLine());
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
    console.log(`Writing: ${msg}`);
    data.lines.push(req.body.msg);
    fsWrite.write(`\n${msg}`);
    res.sendStatus(201);
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
