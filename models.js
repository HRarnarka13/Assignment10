'use strict';
const mongoose = require('mongoose');
const uuid = require('node-uuid');

const UserSchema = mongoose.Schema({
    name : {
        type     : String,
        required : true,
    },
    token : {
        type : String,
        default : uuid.v4(),
    },
    age : {
        type : Number,
        min : 0,
        max : 150,
    },
    gender : {
        type : String,
        maxlength : 1,
        minlength : 1,
        validation : (val) => {
            return val === "m" || val === "f" || val === "o";
        }
    }
});

const CompanySchema = mongoose.Schema({
    name : {
        type     : String,
        required : true,
    },
    description : {
        type     : String,
        required : true,
    },
    punchcard_lifetime : {
        type     : Number,
        required : true,
        min      : 0,
    }
});

const PunchcardSchema = mongoose.Schema({
    company_id : {
        type : String,
        required : true
    },
    user_id : {
        type : String,
        required : true,
    },
    created : {
        type : Date,
        default : new Date(),
    }
});

module.exports = {
    User    : mongoose.model('User', UserSchema),
    Company : mongoose.model('Company', CompanySchema),
    Punchcard : mongoose.model('Punchcard', PunchcardSchema),
};
