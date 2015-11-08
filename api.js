'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const elasticsearch = require('elasticsearch');
const models = require('./models');
const api = express();
const adminToken = 'rssiprmp';

api.use(bodyParser.json());

// Returns a list of all registered companies
api.get('/companies', (req, res) => {
    models.Company.find({}, (err, docs) => {
        if (err) {
            res.status(500).send('Error getting companies');
            return;
        }
        res.status(200).send(docs);
    });
});

/* Adds a new company to the database
 * Example input : {
 *    name: "Glo",
 *    description : "Healty goodshit",
 *    punchcard_liftime: 10
 * }
 */
api.post('/companies', (req, res) => {
    // Check if the admin token is set and correct
    if (req.headers.hasOwnProperty('admin_token') && req.headers.admin_token === adminToken)
    {
        const company = new models.Company(req.body);
        // Validate company
        company.validate((err) => {
            if (err) {
                res.status(412).send(err.message);
                return;
            }
            // Save company to database
            company.save((err, docs) => {
                if (err) {
                    res.status(500).send(err);
                    return;
                }
                // Return
                res.status(201).send({ 'company_id' : docs._id });
                return;
            });
        });
    } else {
        res.status(401).send('Admin token missing or incorrect');
        return;
    }
});

/* Returns the company with the given id, if the company is not found the server
 * returns 404 not found status code.
 */
api.get('/companies/:id', (req, res) => {
    const id = req.params.id;
    // Find the user by id
    models.Company.findOne({ '_id' : id }, (err, docs) => {
        if (err) {
            res.status(500).send('Error getting user.');
            return;
        }
        if (!docs) {
            res.status(404).send('User not found.');
            return;
        }
        res.status(200).send(docs);
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
        // Check if the company exsist
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
