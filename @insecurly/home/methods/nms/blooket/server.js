const express = require('express')
const app = express();
const path = require("path");
const request = require("request-promise");
app.use(express.json());
request.get("https://goldquest.blooket.com/gold/play/landing",function(a,resp,c){
global.cookiew = resp.headers["set-cookie"][0].split(";")[0];
console.log("Blooket Cookie Ready!");
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});
app.get('/script.js', (req, res) => {
  res.sendFile(path.join(__dirname, "/script.js"));
});
app.post('/join', (req, res) => {
  try {
  request.put({body:req.body,json:true,uri:"https://fb.blooket.com/c/firebase/join",headers:{Cookie:global.cookiew}}).pipe(res);
  } catch(e){res.send(JSON.stringify({success:false,errType:"",msg:e}));}
  console.log("Joining game " + req.body.id + " with name " + req.body.name + "!");
});
app.listen(process.env.PORT, function() {
  console.log('Webserver started on port ' + process.env.PORT + '!');
});
