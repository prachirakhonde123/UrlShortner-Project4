const urlModel = require('../Models/urlModel')
const validurl = require('valid-url')
const shortid = require('shortid')
const redis = require('redis')
let axios = require('axios')
const { promisify } = require("util");
//const config = require('config')
const baseURL = "http://localhost:3000"
const { isValid, isValidBody } = require('../validator/validator');
const { url } = require('inspector');


//_________________________________Connected with Redis__________________________
const redisClient = redis.createClient(
    11198,              //Port Number
    "redis-11198.c212.ap-south-1-1.ec2.cloud.redislabs.com",   // End Point
    { no_ready_check: true }
  );

  redisClient.auth("hqVpSUsiDhL73AKLBcQCRWEBp8MFHWh7", function (err) {     //Password of redis
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {     //Listening to Port
    console.log("Connected to Redis..");
  });


const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);  //function to set cache
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);   // function to get data from cache


const createURL = async function (req, res) {
    try {
        const data = req.body
        const { longUrl } = data

        //let urlRegex =  "((http|https)://)(www.)?" + "[a-zA-Z0-9@:%._\\+~#?&//=]{2,256}\\.[a-z]"+ "{2,6}\\b([-a-zA-Z0-9@:%._\\+~#?&//=]*)"

        
        //______________________If body is Empty__________________________________________________
        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, message: "Body can't be empty" })
        }
        
        //_________________________If longUrl is not given_________________________________________
        if (!longUrl) {
            return res.status(400).send({ status: false, message: "Please Provide LongURL" })
        }
        
        //_______________________If body contains extra keys____________________________________________
        if (Object.keys(data).length !== 1) {
            return res.status(400).send({ status: false, message: "Body can contain only one key and i.e longUrl" })
        }

        // if (!longUrl.match(urlRegex)){
        //     return res.status(400).send({status:false, message:"invalid Url"})
        // }
        
        //______________________LongUrl validations___________________________________________________
        if (longUrl) {
            if (!isValid(longUrl)) return res.status(400).send({ status: false, message: "Please Provide Valid LongUrl" })

            if (!validurl.isWebUri(longUrl)) return res.status(400).send({ status: false, message: "Your Url is Invalid. Please Provide Valid LongUrl" })
        }

        
        // if(longUrl){
        //     var validLink = false
        //     await axios.get(longUrl)
        //     .then((res)=>{
        //         if (res.status == 200 || res.status == 201)
        //         validLink = true; 
        //     })
        //     .catch((error) => { validLink = false })
        //     if(validLink==false)
        //     return res.status(400).send({ status: false, message: "invalid url please enter valid url!!" })
        // }

        // let abc = await axios.get(longUrl)
        // .then(()=>longUrl)
        // .catch(()=>null)
        // if(abc!== longUrl){
        //     return res.status(400).send({ status: false, message: "invalid url please enter valid url!!" })
        // }
        
        // //______________________________In case of invalid Link______________________________
        // if(validLink == false) return res.status(400).send({status : false, message : "Invalid Url from Axios"})
        
        //_______________________Cache_______________________________________________________________
        let cache = await GET_ASYNC(`${longUrl}`)
        if(cache){
            //console.log("Data from Redis")
            cache = JSON.parse(cache)
            return res.status(201).send({status : true, message: "Data from Cache", data : cache})

        }

        //_____________________________Duplicate longUrl______________________________________________________
        const duplicateUrl = await urlModel.findOne({ longUrl: longUrl }).select({_id : 0,longUrl : 1, shortUrl : 1, urlCode : 1})
        if (duplicateUrl) {
            //new
            await SET_ASYNC(`${longUrl}`, JSON.stringify(duplicateUrl), 'EX', 60*2)
            return res.status(201).send({ status: true, message: "LongUrl is already Used", data : duplicateUrl })
        }
        

        const codeUrl = shortid.generate(longUrl).toLowerCase()  // shortcode is generated
        const shortUrl = baseURL + "/" + codeUrl     // shortUrl created


        data["urlCode"] = codeUrl
        data["shortUrl"] = shortUrl

        const createUrl = await urlModel.create(data)
        res.status(201).send({ status: true, data: data })
    }

    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}



////////////////////////////////////////////////////////////////////////////////////////////////////////

const getUrl = async function (req, res){
    try{
        let urlCode = req.params.urlCode

        if(!shortid.isValid(urlCode)){
            return res.status(400).send({status : false, message : "Sorry! Wrong Urlcode. Provide valid UrlCode"})
        }

        //_______________________fetching data from cache_________________________________________________
        let getUrlCachedData = await GET_ASYNC(`${urlCode}`)
        if(getUrlCachedData){
            console.log("Data from Redis")
            res.status(302).redirect(getUrlCachedData)
        }
        // let cachedURLCode = await GET_ASYNC(`${urlCode}`)
        // if (cachedURLCode) {
        //     return res.status(302).redirect(cachedURLCode)
        // }
        
        else{
            let url = await urlModel.findOne({urlCode : urlCode})
            //____________________If urlcode does not exist______________________________________________
            if(!url){
                return res.status(404).send({status : false, message : 'No data found with urlCode'})
            }
            
            //________________________Setting urlcode in cache_______________________________________________
            await SET_ASYNC(`${urlCode}`, JSON.stringify(url.longUrl), 'EX' , 60)
            console.log("Fetching Data from DB")
            return res.status(302).redirect(url.longUrl);
        }
    }

    catch(err){
        res.status(500).send({status : false, message : err.message})
    }
}


module.exports = { createURL, getUrl }




