const express = require('express');
const session = require('express-session');
const loki = require('lokijs');
const app = express();

const db = new loki('esports.db', { autoload: true, autosave: true, autosaveInterval: 4000 });
let content;

db.loadDatabase({}, () => {
    content = db.getCollection('content') || db.addCollection('content');
    if (content.data.length === 0) {
        content.insert({ type: 'music', url: '' });
        content.insert({ type: 'roster', list: [] });
        content.insert({ type: 'gallery', wins: [], loses: [] });
    }
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'aga-secret', resave: false, saveUninitialized: true }));

const isAdmin = (req, res, next) => req.session.admin ? next() : res.redirect('/login');

app.get('/', (req, res) => {
    const music = content.findOne({ type: 'music' });
    const roster = content.findOne({ type: 'roster' });
    const gallery = content.findOne({ type: 'gallery' });
    res.render('index', { music, roster: roster ? roster.list : [], gallery });
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
    if (req.body.username === 'admin' && req.body.password === 'aga123') {
        req.session.admin = true;
        res.redirect('/admin');
    } else { res.send('Hatalı!'); }
});

app.get('/admin', isAdmin, (req, res) => {
    const music = content.findOne({ type: 'music' });
    res.render('admin', { music });
});

app.post('/admin/update-music', isAdmin, (req, res) => {
    let music = content.findOne({ type: 'music' });
    music.url = req.body.url;
    content.update(music);
    res.redirect('/admin');
});

app.post('/admin/add-player', isAdmin, (req, res) => {
    let roster = content.findOne({ type: 'roster' });
    roster.list.push({ nick: req.body.nick, role: req.body.role, image: req.body.image });
    content.update(roster);
    res.redirect('/admin');
});

app.post('/admin/add-result', isAdmin, (req, res) => {
    let gallery = content.findOne({ type: 'gallery' });
    gallery[req.body.type].push(req.body.image);
    content.update(gallery);
    res.redirect('/admin');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu aktif: ${PORT}`));
