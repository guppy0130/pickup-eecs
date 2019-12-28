const express = require('express');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const sass = require('node-sass-middleware');

const app = express();
const port = process.env.PORT || 3000;

const prod = process.env.PRODUCTION === undefined ? true : !process.env.PRODUCTION;

if (!prod) {
    require('dotenv').config();
}

const fs = require('fs');
const filePath = 'data.txt';
const fsWrite = fs.createWriteStream(filePath, {
    flags: 'a'
});

const addParser = bodyParser.urlencoded({
    extended: false,
    parameterLimit: 2 // msg, tags
});

const readline = require('readline');
readline.createInterface({
    input: fs.createReadStream(filePath)
}).on('line', line => {
    let info = line.split('\t');
    let msg = info[0];
    let tags;
    try {
        tags = JSON.parse(info[1]);
    } catch (e) {
        // just skip junk
        return;
    }

    for (let tag of tags) {
        if (data.lines[tag] === undefined) {
            data.lines[tag] = [];
        }
        data.lines[tag].push(msg);
    }

    if (data.lines.all === undefined) {
        data.lines.all = [];
    }
    data.lines.all.push({msg, tags});
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
    lines: {},
    allLines: [],
    GANALYTICS: process.env.GANALYTICS
};

const random = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
};

const selectLines = (tags) => {
    if (tags === undefined || tags.length === 0) {
        // return a random line from any
        return data.lines.all;
    }

    let possibles = data.lines[tags.shift()];
    for (let tag of tags) {
        let lines = data.lines[tag];
        possibles = [...possibles].filter(value => lines.includes(value));
    }

    possibles = possibles || [];
    return possibles;
};

const selectRandomLine = (tags) => {
    const possibles = selectLines(tags);
    if (!possibles) {
        throw new Error('empty data');
    }
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
        title: `${data.title} - Add`,
        GANALYTICS: data.GANALYTICS,
        prod
    });
});

app.get('/about', (req, res) => {
    res.render('about', {
        title: `${data.title} - About`,
        GANALYTICS: data.GANALYTICS,
        prod
    });
});
app.get('/:tags?/:id?', (req, res) => {
    const renderNoLines = (message) => {
        return res.render('404', {
            title: `${data.title} - Error`,
            message,
            GANALYTICS: data.GANALYTICS,
            prod
        });
    };

    const tags = (req.params.tags !== undefined && isNaN(req.params.tags)) ? req.params.tags.split(',') : [];
    let id = !isNaN(req.params.tags) ? req.params.tags : req.params.id;
    id = id >= 0 ? id : data.lines.all.length + Number(id);
    let msg;

    try {
        if (tags.length > 0 && !isNaN(id)) {
            // /tag/id
            const selectedLines = selectLines(tags);
            if (id < selectedLines.length) {
                msg = selectedLines[id];
            } else {
                return renderNoLines('index too high');
            }
        } else if (tags.length === 0 && !isNaN(id)) {
            // /id
            if (id < data.lines.all.length) {
                msg = data.lines.all[id];
            } else {
                return renderNoLines('index too high');
            }
        } else {
            // /tags
            msg = selectRandomLine(tags);
            if (typeof msg !== 'object' && typeof msg !== 'string') {
                return renderNoLines('no lines with those tags');
            }
        }
    } catch (err) {
        if (err.message === 'empty data') {
            return renderNoLines('no data! Be the first to add a line?');
        } else {
            return renderNoLines(err);
        }
    }

    const tag = (req.params.tags !== undefined && isNaN(req.params.tags)) ? req.params.tags.split(',') : [];

    return res.render('index', {
        title: data.title,
        message: msg.msg || msg,
        number: data.lines.all.indexOf(msg),
        your: req.query.yourName || '',
        their: req.query.theirName || '',
        tag: tag.length > 0 ? tag : msg.tags.join(','),
        GANALYTICS: data.GANALYTICS,
        prod
    });
});

app.post('/add', addParser, (req, res) => {
    // 409 all duplicates. This appears to be an big-O(n^2) operation
    let tags = req.body.tags.split(',');

    for (let tag of tags) {
        if (data.lines[tag]) {
            for (let line of data.lines[tag]) {
                if (line.match(req.body.msg)) {
                    return res.status(409).render('404', {
                        message: 'Line already exists with those tags, sorry',
                        GANALYTICS: data.GANALYTICS,
                        prod
                    });
                }
            }
        }
    }

    // validate the line
    // should be only one line long (no newline characters)
    // should have none of the following characters: .?!
    if (req.body.msg.match(/\n/gi) || req.body.msg.match(/\.|\?|!/gi) || req.body.msg.match(/^$/gi)) {
        return res.status(400).render('404', {
            message: 'Lines should be only one line long and have none of the following characters: .?!',
            GANALYTICS: data.GANALYTICS,
            prod
        });
    }

    // add the line to each of the tags
    for (let tag of tags) {
        if (!data.lines[tag]) {
            data.lines[tag] = [];
        }
        data.lines[tag].push(req.body.msg);
    }
    data.lines.all.push({
        msg: req.body.msg,
        tags
    });
    fsWrite.write(`${req.body.msg}\t${JSON.stringify(tags)}\n`);
    return res.status(201).render('404', {
        title: `${data.title} - Submit Success`,
        message: 'Thanks for submitting',
        GANALYTICS: data.GANALYTICS,
        prod
    });
});

const server = app.listen(port, () => {
    console.log(`listening on port ${port}`);
});

process.on('SIGINT', () => {
    console.log('closing down');
    server.close();
    fsWrite.end();
    // const cp = require('child_process');
    // cp.exec(`sed '$d' ${filePath}`);
});
