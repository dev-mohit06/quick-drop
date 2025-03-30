const router = require('express').Router();

router.get('/',(req,res) => {
    res.send("Welcome to QuickDrop's Api Server");
});

module.exports = router;