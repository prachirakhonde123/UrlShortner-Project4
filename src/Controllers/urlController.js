const urlModel = require('../Models/urlModel')
const validurl = require('valid-url')
const shortid = require('shortid')
const redis = require('redis')
const { promisify } = require("util");
//const config = require('config')
const baseURL = "http://localhost:3000"
const { isValid, isValidBody } = require('../validator/validator');
const { url } = require('inspector');



const redisClient = redis.createClient(
    11198,
    "redis-11198.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );

  redisClient.auth("hqVpSUsiDhL73AKLBcQCRWEBp8MFHWh7", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });


const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


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
        const shortUrl = baseURL + "/" + codeUrl     // shortUrl created

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



////////////////////////////////////////////////////////////////////////////////////////////////////////

const getUrl = async function (req, res){
    try{
        let urlCode = req.params.urlCode
        let getUrlCachedData = await GET_ASYNC(`${urlCode}`)
        if(getUrlCachedData){
            res.status(302).redirect(getUrlCachedData)
        }
        else{
            let url = await urlModel.findOne({urlCode : urlCode}).select({_id : 0, longUrl : 1});
            if(!url){
                return res.status(404).send({status : false, message : 'No data found with this url'})
            }
            await SET_ASYNC(`${urlCode}`, JSON.stringify(url.longUrl), 'EX', 60)
            res.status(302).redirect(url.longUrl);
        }
    }
    catch(err){
        res.status(500).send({status : false, message : err.message})
    }
}









module.exports = { createURL, getUrl }


/**
 const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  13190,
  "redis-13190.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("gkiOIPkytPI3ADi14jHMSWkZEo2J5TDG", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});
 */

