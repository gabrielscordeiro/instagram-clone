const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const objectId = require('mongodb').ObjectId;
const multiparty = require('connect-multiparty');
const mv = require('mv');
const fs = require('fs');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(multiparty());

app.use(function(req, res, next){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

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


app.get('/imagens/:imagem', function (req, res) {
    let img = req.params.imagem;

    fs.readFile(`./uploads/${img}`, function (err, response) {
        if (err) {
            res.status(400).json(err)
            return;
        } else {
            res.writeHead(200, {
                'content-type':'image/jpg'
            });

            res.end(response);
        }
    });
});

app.put('/api/:id', function (req, res) {
    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.update({
                _id: objectId(req.params.id)
            }, {
                    $push: {//inclui um elemento dentro de um conjunto de arrays, não atualiza o conteúdo, somente incluí
                        comentarios:{
                            id_comentario: new objectId(),
                            comentario: req.body.comentario
                        }
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
            collection.update({},
                {
                    $pull:{//é o inverso do push
                        comentarios: {
                            id_comentario: objectId(req.params.id)
                        }
                    }                    
                },
                {multi: true},
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

function getDateTime() {
    let date = new Date();

    let hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    let min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    let sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    let year = date.getFullYear();

    let month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    let day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return `hora-${hour}-${min}-${sec}-dia-${day}-${month}-${year}-`;
}
