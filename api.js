'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const elasticsearch = require('elasticsearch');
const models = require('./models');
const api = express();
const adminToken = 'rssiprmp';
const client = new elasticsearch.Client({
    'host' : 'localhost:9200',
    'log'  : 'error',
});

api.use(bodyParser.json());

function isAdmin(header) {
    return header.hasOwnProperty('admin_token') && header.admin_token === adminToken;
}

function toCompanyDTO(company) {
    return {
        id : company.id,
        title : company.title,
        description : company.description,
        url : company.url
    };
}

// Returns a list of all registered companies
api.get('/companies', (req, res) => {

    const page = req.query.page || 0;  // Requseted page number or default page 0
    const max  = req.query.max  || 20; // Requested entries per page or default entries count 20

    const promise = client.search({
        'index' : 'companies',
        'type'  : 'company',
        'size'  : max,
        'from'  : page,
        'body'  : {
            'query' : {
                'match_all' : {}
            }
        }
    });

    promise.then((resp) => {
        res.status(200).send(resp.hits.hits.map((r) => {
            return toCompanyDTO(r._source);
        }));
    }, (err) => {
        if (err.status === 404) {
            res.status(200).send([]);
            return;
        }
        res.status(500).send(err.message);
    });
});

/* Adds a new company to the database
 * Example input : {
 *    title: "Glo",
 *    description : "Healty goodshit",
 *    url : "http://www.glo.is",
 *    punchcard_liftime: 10
 * }
 */
api.post('/companies', (req, res) => {
    // Check if the admin token is set and correct
    if ( !isAdmin(req.headers) ) {
        res.status(401).send('Admin token missing or incorrect');
        return;
    }

    // Check if the Content-Type requested is supported
    if ( !req.is('application/json') ) {
        res.status(415).send('Content-Type not supported.');
        return;
    }
    const company = new models.Company(req.body);

    // Check if a company with the same name exists.
    models.Company.findOne({'title' : req.body.title }, (err, foundCompany) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        if (foundCompany) {
            res.status(409).send('A company with the same name already exists');
            return;
        }
        // Validate request body
        company.validate((err) => {
            if (err) {
                res.status(412).send(err.message);
                return;
            }
            // Save company to database
            company.save((err, docs) => {
                if (err) {
                    res.status(500).send(err.message);
                    return;
                }

                const data = {
                    'id'         : docs.id,
                    'title'      : docs.title,
                    'description': docs.description,
                    'url'        : docs.url,
                    'created'    : new Date(),
                };

                // Create index on company title
                client.index({
                    'index' : 'companies',
                    'type'  : 'company',
                    'id'    : docs._id.toString(),
                    'body'  : data,
                }).then((resp) => {
                    console.log(resp);
                    res.status(201).send({ 'id' : docs.id });
                    return;
                }, (err) => {
                    if (err) {
                        res.status(500).send(err.message);
                    }
                });
            });
        });

    });
});

api.post('/companies/search', (req, res) => {
    var searchstr = req.body.search || "";
    console.log(searchstr);
    console.log(searchstr);
    client.search({
        'index': 'companies',
        'body' : {
            'query' : {
                'match' : {
                    _all : searchstr
                }
            }
        }
    }, (err, response) => {
        if (err) {
            res.status(500).send(err.message);
        }
        res.status(200).send(response.hits.hits.map((r) => {
            return toCompanyDTO(r._source);
        }));
    });
});

/* Returns the company with the given id, if the company is not found the server
 * returns 404 not found status code.
 */
api.get('/companies/:id', (req, res) => {
    const id = req.params.id;
    // Find the user by id
    models.Company.findOne({ 'id' : id }, (err, docs) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        if (!docs) {
            res.status(404).send('User not found.');
            return;
        }
        res.status(200).send({
            id : docs.id,
            title : docs.title,
            description : docs.description,
            url : docs.url
        });
    });
});

api.post('/companies/:id', (req, res) => {
    // Check if the admin token is set and correct
    if ( !isAdmin(req.headers) ) {
        res.status(401).send('Admin token missing or incorrect');
        return;
    }

    // Check if the Content-Type requested is supported
    if ( !req.is('application/json') ) {
        res.status(415).send('Content-Type not supported.');
        return;
    }
    const id = req.params.id;
    models.Company.findOne({ 'id' : id }, (err, foundCompany) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        if (!foundCompany) {
            res.status(404).send('Company not found.');
            return;
        }
        console.log('Company', foundCompany);
        const company = new models.Company(req.body);
        company.validate((err) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            models.Company.findOne({ 'title' : company.title }, (err, sameName) => {
                if (err) {
                    res.status(500).send(err.message);
                    return;
                }
                if (sameName) {
                    res.status(409).send('A company with the same name already exists');
                    return;
                }

                console.log('Req.body', req.body);
                models.Company.update({'_id' : foundCompany._id }, req.body, (err) => {
                    if (err) {
                        res.status(500).send(err.message);
                        return;
                    }

                    client.delete({
                        'index' : 'companies',
                        'type'  : 'company',
                        'id'    : foundCompany._id.toString()
                    }).then(() => {
                        client.index({
                            'index' : 'companies',
                            'type'  : 'company',
                            'id'    : foundCompany._id.toString(),
                            'body'  : {
                                'id'         : id,
                                'title'      : company.title,
                                'description': company.description,
                                'url'        : company.url,
                                'created'    : new Date(),
                            }
                        }).then(() => {
                            res.status(204).send();
                        }, (err) => {
                            if (err) {
                                res.status(500).send(err.message);
                                return;
                            }
                        });
                    }, (err) => {
                        if (err) {
                            res.status(500).send(err.message);
                            return;
                        }
                    });
                });
            });
        });
    });
});

api.delete('/companies/:id', (req, res) => {
    // Check if the admin token is set and correct
    if ( !isAdmin(req.headers) ) {
        res.status(401).send('Admin token missing or incorrect');
        return;
    }

    const id = req.params.id;
    models.Company.findOne({ 'id' : id}, (err, docs) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        models.Company.remove({ 'id' : id }, (err) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            client.delete({
                'index' : 'companies',
                'type'  : 'company',
                'id'    : docs._id.toString()
            }).then(() => {
                res.status(204).send();
                return;
            }, (err) => {
                if (err) {
                    res.status(500).send(err.message);
                    return;
                }
            });
        });
    });
});


// Returns a list of all registered users
api.get('/users', (req,res) => {
    models.User.find({}, (err, docs) => {
        if (err) {
            res.status(500).send('Error, cannot get users');
            return;
        }
        res.status(200).send(docs.map((val) => { val.token = undefined; return val; }));
    });
});

/* Returns the user with the given id, if the user is not found the server
 * returns 404 not found status code.
 */
api.get('/users/:id', (req,res) => {
    const id = req.params.id;
    models.User.findOne({ '_id' : id }, (err, docs) => {
        if (err) {
            res.status(500).send('Error, cannot get user');
            return;
        }
        if (!docs) {
            res.status(404).send('User not found');
            return;
        }
        res.status(200).send(docs);
    });
});

/* Adds a new user. Returns the user object and 201 created status code if the
 * request was successfull. If the body object is invalid in the request the
 * server responds 412 status code.
 * Example input : {
 *     name : "Mike Cohn",
 *     age : 53,
 *     gender : "m",
 * }
 */
api.post('/users', (req, res) => {
    const user = new models.User(req.body);
    user.validate((err) => {
        if (err) {
            res.status(412).send(err);
            return;
        }
        user.save((err,docs) => {
            if (err) {
                res.status(500).send('Error, adding user');
                return;
            }
            res.status(201).send(docs);
        });
    });
});

/* Adds a new punch to the user account, the user is specified with the token property
 * in the request header and the company in the request parameter. If the company is
 * not found the server returns a 404 not found status code. If the token header is not
 * set hte server returns 401 Unauthorized. If the user has already a punchcard for the
 * given company the server returns 409 Conflict.
 */
api.post('/punchcards/:company_id', (req, res) => {
    const company_id = req.params.company_id;

    models.Company.findOne({ '_id' : company_id }, (err, company) => {
        if (err) {
            res.status(500).send('Error getting company.');
            return;
        }
        // Check if the company exist
        if (!company) {
            res.status(404).send('Company not found.');
            return;
        }
        // Check if the token header is set
        if (!req.headers.hasOwnProperty('token')) {
            res.status(401).send('Token not set');
            return;
        }
        // Get the user token from header
        const userToken = req.headers.token;
        models.User.findOne({ 'token' : userToken }, (err, user) => {
            if (err) {
                res.status(500).send('Error when checking user token');
                return;
            }
            if (!user) {
                res.status(401).send('User not found with provided token');
                return;
            }

            const user_id = user._id; // Get the user id
            models.Punchcard.findOne({ 'user_id' : user_id, 'company_id' : company_id }, (err, punchcard) =>{
                if (err) {
                    res.status(500).send('Error when getting punchcard');
                    return;
                }
                if (punchcard) {
                    res.status(409).send('User already has a punchcard for the given company');
                    return;
                }
                const new_punchcard = new models.Punchcard({
                    'user_id' : user_id,
                    'company_id' : company_id,
                });
                new_punchcard.save((err, punch) => {
                    if (err) {
                        res.status(500).send('Error when adding punch');
                        return;
                    }
                    res.status(201).send({ 'punch_id' : punch._id });
                });
            });
        });
    });
});

module.exports = api;
