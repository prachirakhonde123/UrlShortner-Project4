const mongoose = require('mongoose')
const shortid = require('shortid')

const urlSchema = new mongoose.Schema({

    urlCode : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true
    },

    longUrl : {
        type : String,
        required : true
    },

    shortUrl : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        default : shortid.generate
    }


},{timestamps : true})

module.exports = mongoose.model("Url", urlSchema)