const express = require('express');
const hbs = require('express-hbs');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;
const prod = process.env.PRODUCTION || true;

const parser = bodyParser.urlencoded({
    extended: false,
    parameterLimit: 2 // msg, tags
});

const readline = require('readline');
readline.createInterface({
    input: require('fs').createReadStream('data.txt')
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

app.post('/add', parser, (req, res) => {
    if (data.lines.includes(req.body.msg)) {
        res.sendStatus(409);
        return;
    }
    data.lines.push(req.body.msg);
    res.sendStatus(201);
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
