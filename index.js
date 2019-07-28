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
    let tags = JSON.parse(info[1]);

    for (let tag of tags) {
        if (data.lines[tag] === undefined) {
            data.lines[tag] = [];
        }
        data.lines[tag].push(info[0]);
    }
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
    lines: {}
};

const random = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
};

const selectRandomLine = (tags) => {
    if (tags === undefined || tags.length === 0) {
        // return a random line from any
        let lines = data.lines[Object.keys(data.lines)[random(Object.keys(data.lines).length)]];
        if (!lines) {
            return [];
        }
        return lines[random(lines.length)];
    }

    let possibles = data.lines[tags.shift()];
    for (let tag of tags) {
        let lines = data.lines[tag];
        possibles = [...possibles].filter(value => lines.includes(value));
    }

    possibles = possibles || [];

    return possibles[random(possibles.length)];
};

app.get('/favicon.ico', (req, res) => {
    return res.status(404);
});

app.get('/api/:tags?', (req, res) => {
    let msg = selectRandomLine(req.params.tags ? req.params.tags.split(',') : []);
    if (typeof msg !== 'string') {
        return res.status(404).json({
            reason: 'no line exists with all those tags',
            tags: req.params.tags.split(',')
        });
    }
    return res.json(msg);
});

app.get('/add', (req, res) => {
    res.render('add', {
        title: `${data.title} - Add`
    });
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/:id(\\d+)', (req, res) => {
    console.log(`id is: ${req.params.id}`);
});

app.get('/:tags?', (req, res) => {
    let msg = selectRandomLine(req.params.tags ? req.params.tags.split(',') : []);
    if (typeof msg !== 'string') {
        return res.render('404', {
            message: 'no line exists with all those tags'
        });
    }
    return res.render('index', {
        title: data.title,
        message: msg
    });
});

app.post('/add', parser, (req, res) => {
    // 409 all duplicates. This appears to be an big-O(n^2) operation
    let tags = req.body.tags.split(',');

    for (let tag of tags) {
        if (data.lines[tag]) {
            for (let line of data.lines[tag]) {
                if (line.match(req.body.msg)) {
                    return res.status(409).render('404', {
                        message: 'Line already exists with those tags, sorry'
                    });
                }
            }
        }
    }

    // validate the line
    // should be only one line long (no newline characters)
    // should have none of the following characters: .?!
    if (req.body.msg.match(/\n/gi) || req.body.msg.match(/\.|\?|!/gi)) {
        return res.status(400).render('404', {
            message: 'Lines should be only one line long and have none of the following characters: .?!'
        });
    }

    // add the line to each of the tags
    for (let tag of tags) {
        if (!data.lines[tag]) {
            data.lines[tag] = [];
        }
        data.lines[tag].push(req.body.msg);
    }
    fsWrite.write(`\n${req.body.msg}\t${JSON.stringify(tags)}`);
    return res.status(201).render('404', {
        message: 'Thanks for submitting'
    });
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
