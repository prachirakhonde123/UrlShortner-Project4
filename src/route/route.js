const express = require('express');
const router = express.Router();
const createUrl = require('../Controllers/urlController')


router.get("/test-me", function(req,res){
    res.send("This is first api!")
})

router.post("/url/shorten", createUrl.createURL)
router.get("/:urlCode", createUrl.getUrl)

//======================== to check if the endpoint is correct or not =========================================
router.all("/**", function (req, res) {
    res.status(400).send({
        status: false,
        msg: "The api you are requesting is not available"
    })
})





module.exports = router;