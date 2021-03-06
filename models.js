'use strict';
const mongoose = require('mongoose');
const uuid = require('node-uuid');
const validUrl = require('valid-url');

const UserSchema = mongoose.Schema({
    name : {
        type     : String,
        required : true,
    },
    token : {
        type    : String,
        default : uuid.v4(),
    },
    age : {
        type : Number,
        min  : 0,
        max  : 150,
    },
    gender : {
        type       : String,
        maxlength  : 1,
        minlength  : 1,
        validation : (val) => {
            return val === "m" || val === "f" || val === "o";
        }
    }
});

const CompanySchema = mongoose.Schema({
    id : {
        type    : String,
        default : uuid.v4,
    },
    // String representing the company name
    title : {
        type     : String,
        required : true,
        unique   : true,
        dropDups : true,
    },
    // String represetning description for the company
    description : {
        type     : String,
        required : true,
    },
    // String representing the company homepage
    url : {
        type     : String,
        required : true,
        validation : (url) => {
            return validUrl.isUri(url);
        }
    },
    //  Date representing the creation date of the company (when it was posted)
    created : {
        type    : Date,
        default : new Date(),
    }
});

CompanySchema.path('title').index({ unique: true });

const PunchcardSchema = mongoose.Schema({
    company_id : {
        type     : String,
        required : true
    },
    user_id : {
        type     : String,
        required : true,
    },
    created : {
        type    : Date,
        default : new Date(),
    }
});

module.exports = {
    User      : mongoose.model('User', UserSchema),
    Company   : mongoose.model('Company', CompanySchema),
    Punchcard : mongoose.model('Punchcard', PunchcardSchema),
};
