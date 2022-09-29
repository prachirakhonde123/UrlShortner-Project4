const urlModel = require('../Models/urlModel')
const validurl = require('valid-url')
const shortid = require('shortid')
//const config = require('config')
const baseURL = "http://localhost:3000"
const { isValid, isValidBody } = require('../validator/validator')


const createURL = async function (req, res) {
    try {
        const data = req.body
        const { longUrl } = data

        if (!isValidBody(data)) {
            return res.status(400).send({ status: true, message: "Body can't be empty" })
        }

        if (!longUrl) {
            return res.status(400).send({ status: false, message: "Please Provide LongURL" })
        }

        if (Object.keys(data).length !== 1) {
            return res.status(400).send({ status: false, message: "Body can contain only one key and i.e longUrl" })
        }

        if (longUrl) {
            if (!isValid(longUrl)) return res.status(400).send({ status: false, message: "Please Provide Valid LongUrl" })

            if (!validurl.isWebUri(longUrl)) return res.status(400).send({ status: false, message: "Your Url is Invalid. Please Provide Valid LongUrl" })
        }

        const duplicateUrl = await urlModel.findOne({ longUrl: longUrl })
        if (duplicateUrl) {
            return res.status(400).send({ status: true, message: "LongUrl is already Used" })
        }

        const codeUrl = shortid.generate(longUrl).toLowerCase()  // shortcode is generated
        //console.log(code)
        const shortUrl = baseURL + "/" + codeUrl     // shortUrl created
        //console.log(shortUrl)

        const duplicateShortUrl = await urlModel.findOne({ shortUrl: shortUrl })
        if (duplicateShortUrl) {
            return res.status(400).send({ status: false, message: "ShortUrl is already exist !" })
        }

        data["urlCode"] = codeUrl
        data["shortUrl"] = shortUrl
        //console.log(data)

        const createUrl = await urlModel.create(data)
        res.send({ status: true, data: data })
    }

    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getUrl = async function (req, res) {
    try {
        const urlcode = req.params.urlCode
        const getUrlList = await urlModel.findOne({ urlCode: urlcode }).select({ _id: 0, longUrl: 1, shortUrl: 1, urlCode: 1 })
        if (!getUrlList) {
            return res.status(404).send({status : false, message : "No data found with this urlCode!"})
        }
        return res.status(302).redirect(getUrlList.longUrl)
    }
    catch (err) {
        res.status(500).send({ status: false, message: "Server Error", error: err.message })
    }
}


module.exports = { createURL, getUrl }

