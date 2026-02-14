const express = require('express');
const session = require('express-session');
const loki = require('lokijs');
const path = require('path');
const app = express();
const db = new loki('esports.db', { autoload: true, autoloadCallback: databaseInitialize, autosave: true, autosaveInterval: 4000 });

function databaseInitialize() {
    let content = db.getCollection('content') || db.addCollection('content');
    if (content.count() === 0) {
        content.insert({ type: 'music', url: '' });
        content.insert({ type: 'roster', list: [] });
        content.insert({ type: 'gallery', wins: [], losses: [] });
    }
}

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'aga-gizli', resave: false, saveUninitialized: true }));

const isAdmin = (req, res, next) => {
    if (req.session.admin) return next();
    res.redirect('/login');
};

app.get('/', (req, res) => {
    const content = db.getCollection('content');
    res.render('index', { 
        music: content.findOne({ type: 'music' }),
        roster: content.findOne({ type: 'roster' }),
        gallery: content.findOne({ type: 'gallery' })
    });
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
    if (req.body.username === 'admin' && req.body.password === 'aga123') {
        req.session.admin = true;
        return res.redirect('/admin');
    }
    res.send('Hatalı giriş!');
});

app.get('/admin', isAdmin, (req, res) => {
    const content = db.getCollection('content');
    res.render('admin', { 
        music: content.findOne({ type: 'music' }),
        roster: content.findOne({ type: 'roster' }),
        gallery: content.findOne({ type: 'gallery' })
    });
});

app.post('/admin/update', isAdmin, (req, res) => {
    const content = db.getCollection('content');
    const item = content.findOne({ type: req.body.type });
    if (req.body.type === 'music') item.url = req.body.url;
    content.update(item);
    res.redirect('/admin');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server hazır!'));
