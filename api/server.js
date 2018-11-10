const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const objectId = require('mongodb').ObjectId;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

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
    let dados = req.body;

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