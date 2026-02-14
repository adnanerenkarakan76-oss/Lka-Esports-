const express = require('express');
const session = require('express-session');
const loki = require('lokijs');
const app = express();
const db = new loki('esports.db', { autoload: true, autoloadCallback: databaseInitialize, autosave: true, autosaveInterval: 4000 });

function databaseInitialize() {
    if (!db.getCollection('stats')) db.addCollection('stats').insert({ wins: 0, losses: 0, instagram: '', banner: '', nextMatch: 'Yakında!', matchTime: '', type: 'global' });
    if (!db.getCollection('players')) db.addCollection('players');
}

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'aga-gizli', resave: false, saveUninitialized: true }));

const isAdmin = (req, res, next) => { req.session.admin ? next() : res.redirect('/login'); };

app.get('/', (req, res) => {
    const stats = db.getCollection('stats').findOne({ type: 'global' });
    const players = db.getCollection('players').chain().data();
    res.render('index', { stats, players });
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
    if (req.body.username === 'admin' && req.body.password === 'aga123') {
        req.session.admin = true; return res.redirect('/admin');
    }
    res.send('Hatalı giriş!');
});

app.get('/admin', isAdmin, (req, res) => {
    const stats = db.getCollection('stats').findOne({ type: 'global' });
    const players = db.getCollection('players').chain().data();
    res.render('admin', { stats, players });
});

app.post('/admin/update-stats', isAdmin, (req, res) => {
    const stats = db.getCollection('stats').findOne({ type: 'global' });
    Object.assign(stats, req.body);
    db.getCollection('stats').update(stats);
    res.redirect('/admin');
});

app.post('/admin/add-player', isAdmin, (req, res) => {
    db.getCollection('players').insert(req.body);
    res.redirect('/admin');
});

app.get('/admin/delete-player/:id', isAdmin, (req, res) => {
    const coll = db.getCollection('players');
    coll.remove(coll.get(req.params.id));
    res.redirect('/admin');
});

app.listen(process.env.PORT || 3000);
