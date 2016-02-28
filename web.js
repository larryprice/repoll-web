var express = require('express'),
	app = express();

app.set('view engine', 'hbs');
app.set('views', './views');
app.use(express.static('public'));

app.get('/', function (req, res) {
	res.render('index', {
		title: 'RePoll',
		src: 'js/welcome.entry.js'
	});
});

app.get('/poll/:id', function (req, res) {
	res.render('poll', {
		title: 'RePoll',
		src: '/js/poll.entry.js',
		poll: req.params.id
	});
});

app.get('/newPoll', function (req, res) {
	res.render('index', {
		title: 'RePoll - Make a new poll',
		src: 'js/newPoll.entry.js'
	});
});

app.listen(process.env.PORT || 3000, function() {
	console.log('RePoll listening...');
});
