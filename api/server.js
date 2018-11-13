const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const objectId = require('mongodb').ObjectId;
const multiparty = require('connect-multiparty');
const mv = require('mv');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(multiparty());

const port = 8080;

app.listen(port);


const db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost', 27017, {}),
    {}
);


console.log(`Servidor rodando na porta ${port}`);

app.get('/', function (req, res) {
    res.send({
        msg: 'Olá'
    });
});

app.post('/api', function (req, res) {
    //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8000');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let files = req.files;

    let pathOrigem = files.arquivo.path;
    let pathDestino = `./uploads/${getDateTime() + files.arquivo.originalFilename}`;
    let urlImagem = files.arquivo.originalFilename;

    mv(pathOrigem, pathDestino, function (err) {
        if (err) {
            res.status(500).json({
                error: err
            });
            return;
        }

        let dados = {
            urlImagem: urlImagem,
            titulo: req.body.titulo
        }

        console.log(dados);

        db.open(function (err, mongoclient) {
            mongoclient.collection('postagens', function (err, collection) {
                collection.insert(dados, function (err, response) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.json(response);
                    }

                    mongoclient.close();
                });
            })
        })
    });
});

app.get('/api', function (req, res) {
    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.find().toArray(function (err, response) {
                if (err) {
                    res.json(err);
                } else {
                    res.json(response);
                }

                mongoclient.close();
            });
        })
    })
});

//Get By ID
app.get('/api/:id', function (req, res) {
    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.find(objectId(req.params.id)).toArray(function (err, response) {
                if (err) {
                    res.json(err);
                } else {
                    res.json(response);
                }

                mongoclient.close();
            });
        })
    })
});

app.put('/api/:id', function (req, res) {
    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.update({
                _id: objectId(req.params.id)
            }, {
                    $set: {
                        titulo: req.body.titulo
                    }
                }, {},
                function (err, response) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.json(response);
                    }

                    mongoclient.close();
                });
        })
    })
});

//Delete by ID
app.delete('/api/:id', function (req, res) {
    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.remove({
                _id: objectId(req.params.id)
            }, function (err, response) {
                if (err) {
                    res.json(err);
                } else {
                    res.json(response);
                }

                mongoclient.close();
            });
        })
    })
});

function getDateTime() {
    let date = new Date();
    
    let hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour; 
    
    let min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    
    let sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    
    let year = date.getFullYear();
    
    let month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    
    let day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    
    return `hora-${hour}-${min}-${sec}-dia-${day}-${month}-${year}-`;
}
