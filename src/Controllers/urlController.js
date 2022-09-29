const urlModel = require('../Models/urlModel')
const validurl = require('valid-url')
const shortid = require('shortid')
//const config = require('config')
const baseURL = "http://localhost:3000"


const createURL = async function(req,res){
    try{
        const data = req.body
        const longUrl = req.body.longUrl

        const codeUrl = shortid.generate(longUrl).toLowerCase()  // shortcode is generated
        //console.log(code)
        const shortUrl = baseURL + "/" + codeUrl     // shortUrl created
        //console.log(shortUrl)

        data["urlCode"] = codeUrl
        data["shortUrl"] = shortUrl
        //console.log(data)

        const createUrl = await urlModel.create(data)
        res.send({status : true, data : createUrl})
    }

    catch(err){
        res.status(500).send({status : false, message : err.message})
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getUrl = async function(req,res){
    const getUrlList = await urlModel.find().select({_id : 0, longUrl : 1, shortUrl : 1, urlCode : 1})
    res.status(200).send({status : true, data : getUrlList})
}


module.exports = {createURL, getUrl}

