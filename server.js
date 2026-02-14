const express = require('express');
const session = require('express-session');
const loki = require('lokijs');
const app = express();
const db = new loki('esports.db', { autoload: true, autoloadCallback: databaseInitialize, autosave: true, autosaveInterval: 4000 });

function databaseInitialize() {
    let stats = db.getCollection('stats') || db.addCollection('stats');
    if (stats.count() === 0) {
        stats.insert({ wins: 0, losses: 0, instagram: 'https://instagram.com', type: 'global' });
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
    const stats = db.getCollection('stats').findOne({ type: 'global' });
    res.render('index', { stats });
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
    const stats = db.getCollection('stats').findOne({ type: 'global' });
    res.render('admin', { stats });
});

app.post('/admin/update', isAdmin, (req, res) => {
    const statsColl = db.getCollection('stats');
    const stats = statsColl.findOne({ type: 'global' });
    stats.wins = req.body.wins;
    stats.losses = req.body.losses;
    stats.instagram = req.body.instagram;
    statsColl.update(stats);
    res.redirect('/admin');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server hazır!'));
