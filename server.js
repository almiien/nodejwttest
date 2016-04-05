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
       name:'xnlsoft',
       password:'123',
       acceso: [           
           'index'
       ]
   }); 
   mario.save(function(err) {
       if (err) throw err;
       console.log('Usuario guardado con exito');
       res.json({success:true});
   })
});

var apiRoutes = express.Router();
//middleware para corroborar que esta presente el token en todas las peticiones al servidor
apiRoutes.use(function(req,res,next) {
    //revisamos si el token viene en  el header parametros url o parametro post
    var token = req.body.token || req.query.token || req.headers['x-access-token'] || null;    
    //decodificar el token
    
    if (token) {
        jwt.verify(token,app.get('superSecret'),function (err,decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'no se pudo autenticar el token'                    
                });
            }else{
                req.decode = decoded;
                next();
            }
        })
    }else {
        if(req.url == '/authenticate'){
            next();
        }else{
            return res.status(403).send({
            success: false,
            message: 'no hay token en la peticion',
            req : req.url
        });   
        }        
    } 
});

apiRoutes.get('/', function(req,res) {
   res.json({message : 'Esta es la mejor api del mundo mundial'}); 
});

apiRoutes.get('/users',function (req,res) {
    var self = this;
    var token = req.body.token || req.query.token || req.headers['x-access-token'] || null;
    self.tokenDecoded;
    jwt.verify(token,app.get('superSecret'), function (err,decoded) {
        if (err) {
            return res.json({
                    success: false,
                    message: 'no se pudo autenticar el token'
                });
        }else{
            self.tokenDecoded = decoded;
            mostrarUsuarios(self.tokenDecoded.user);            
        }
    });
    function mostrarUsuarios(user) {
        if(user.acceso.indexOf('users') !== -1){
            User.find({},function(err,users){
                return res.json(users) ;       
            });
        }else{
            return res.json({
                success : false,
                message : 'no tiene acceso a este recurso'
            });
        }            
    }
});

apiRoutes.post('/authenticate',function (req,res) {
    User.findOne({
        name: req.body.name
    }, function (err,user) {
        if (err) throw err;
        if (!user) {
            res.json({
                success: false,
                message: 'El usuario no existe'
            });
        }else if (user) {
            //checamos que el password coincida
            if (user.password != req.body.password) {
               res.json({
                    success: false,
                    message: 'La contraseña es incorrecta'
                }); 
            }else {
                //si el usuario existe y el password coincide
                //se crea el token para el usuario
                //var token = jwt.sign({usuario:user,acceso:['index','home','usuarios']},app.get('superSecret'),{
                var token = jwt.sign({user : user},app.get('superSecret'),{
                    expiresIn: 3600 // solo sera valido por 24 horas
                });
                res.json({
                    success: true,
                    message: 'Disfruta tu token',
                    token: token
                });              
            }
        }                
    });
});

app.use('/api',apiRoutes);

app.listen(port);
console.log('La magia sucede en http://localhost:'+port);