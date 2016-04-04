var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user.js');

var port = process.env.PORT || 3000;
mongoose.connect(config.database);
app.set('superSecret',config.secret);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.get('/', function (req,res) {
   res.send('Hola la api esta en http://localhost:'+port+'/api' ); 
});

app.get('/setup',function (req,res) {
   var mario = new User({
       name:'Mario Del Moral',
       password:'123',
       admin: true
   }); 
   mario.save(function(err) {
       if (err) throw err;
       console.log('Usuario guardado con exito');
       res.json({success:true});
   })
});

var apiRoutes = express.Router();
apiRoutes.get('/', function(req,res) {
   res.json({message : 'Esta es la mejor api del mundo mundial'}); 
});

apiRoutes.get('/users',function (req,res) {
    User.find({},function (err,users) {
        res.json(users);
    }); 
});

app.use('/api',apiRoutes);

app.listen(port);
console.log('La magia sucede en http://localhost:'+port);