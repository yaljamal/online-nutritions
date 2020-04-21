'use strict';
const ejsLint = require('ejs-lint');

let meals = {};
let information = {};
let searchResults = {};
var calories;
require('dotenv').config();

const pg = require('pg');
const express = require('express');
const PORT = process.env.PORT || 3030;
const app = express();
const methodOverride = require('method-override');
const superagent = require('superagent');
app.use(express.static('./public'));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));

const client = new pg.Client(process.env.DATABASE_URL);


var request = require("request");



app.get('/about-us', aboutUs);
app.get('/' , getIndex);
app.get('/info',showCalculater);
app.get('/result',calculater);
app.post('/result',usernameExist);
app.get('/meals' , getMeals);





function getMeals(req,res){
  res.render('pages/meals');
}
app.get('/search',searchRout);

function getIndex(req,res){
  res.render('pages/index');
}
function showCalculater(req,res){
  res.render('pages/calculate');
}
function calculater(req,res){
  let userName = req.query.username;
  let weightInfo = req.query.weight;
  let heightInfo = req.query.height;
  let ageInfo = req.query.age;
  let genderInfo = req.query.gender;
  let SQL1 = 'SELECT user_name FROM user_info;';
  client.query(SQL1)
    .then(data => {
      let exist = true;
      data.rows.forEach(val => {
        if (val.user_name === userName) { exist = false;}
      })
      if(exist){
      let SQL = 'INSERT INTO user_info (user_name,weight,height,age,gender) VALUES ($1,$2,$3,$4,$5);';
      let safeValues = [userName, weightInfo, heightInfo, ageInfo, genderInfo];
      client.query(SQL, safeValues)
        .then(data => { console.log('done'); })
      var informationOptions = {
        method: 'POST',
        url: 'https://bmi.p.rapidapi.com/',
        headers: {
          'x-rapidapi-host': 'bmi.p.rapidapi.com',
          'x-rapidapi-key': 'de72feb0d1msh4cd6880191f064fp1248d3jsnb2c8b04da480',
          'content-type': 'application/json',
          accept: 'application/json'
        },
        body: {
          weight: { value: weightInfo, unit: 'kg' },
          height: { value: heightInfo, unit: 'cm' },
          sex: genderInfo,
          age: ageInfo
        },
        json: true
      };
      request(informationOptions, function (error, response, body) {
        if (error) throw new Error(error);
        information = body;
        calories = information.bmr.value;
        res.render('pages/results', { info: information });
      });
    }
    else{
      console.log('the user name already exist');
    }


    })
}

function usernameExist(req,res){
  let userNameKeyword = req.body.previousUsername;
  let SQL = `SELECT user_name FROM user_info ;`;
  client.query(SQL)
  .then(data =>{
    let exist = false;
    data.rows.forEach(val => {
      if (val.user_name === userNameKeyword) { exist = true;}
    })
    if(exist){
      let SQL1 = `SELECT * FROM user_info WHERE user_name = '${userNameKeyword}';`; 
      client.query(SQL1)
      .then(dataSaved =>{
        var informationOptions = {
          method: 'POST',
          url: 'https://bmi.p.rapidapi.com/',
          headers: {
            'x-rapidapi-host': 'bmi.p.rapidapi.com',
            'x-rapidapi-key': 'de72feb0d1msh4cd6880191f064fp1248d3jsnb2c8b04da480',
            'content-type': 'application/json',
            accept: 'application/json'
          },
          body: {
            weight: { value: dataSaved.rows[0].weight, unit: 'kg' },
            height: { value: dataSaved.rows[0].height, unit: 'cm' },
            sex: dataSaved.rows[0].gender,
            age: dataSaved.rows[0].age
          },
          json: true
        };
        request(informationOptions, function (error, response, body) {
          if (error) throw new Error(error);
          information = body;
          calories = information.bmr.value;
          res.render('pages/results', { info: information,DB: dataSaved.rows[0] });
          
        });
        
      })
    }
    
  }) 

}

function searchRout(req,res){
let keyWord = req.query.input;
var options = {
  method: 'GET',
  url: 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/searchComplex',
  qs: {
    query: keyWord,
    minProtein: '5',
    maxProtein: '100',
    limitLicense: 'false',
    offset: '0',
    number: '10'
  },
  headers: {
    'x-rapidapi-host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
    'x-rapidapi-key': 'de72feb0d1msh4cd6880191f064fp1248d3jsnb2c8b04da480'
  }
};

request(options, function (error, response, body) {
  if (error) throw new Error(error);
  searchResults = JSON.parse(body);;
  res.render('pages/search', { food: searchResults });
});
}


function aboutUs(req, res) {
  res.render('pages/about-us')
}








app.get('*', (req, res) => {
    res.status(404).send('This route does not exist!!');
})
// client.connect()
//   .then(() => {

//   });
  app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`)
  })  
  


