var Client = require('node-rest-client').Client;
var http = require('http');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://cekky:cekky1991@ds129386.mlab.com:29386/mxpwebapp";
var Twit = require('twit');
var TwitterBot = require("node-twitterbot").TwitterBot;





    var username = 'fraceks';
    var apiKey = '371189c74c71e5e5728caa547c0ad83e1754faa8';
    var fxmlUrl = 'https://flightxml.flightaware.com/json/FlightXML3/';

    var client_options = {
    	user: username,
    	password: apiKey
    };

    var twitter_BOT = new Twit({
        consumer_key: 'FLtwZjySUjhCuqmA3lDzHjG2l',
        consumer_secret: 'WVlDDBptYRazMFkCBjjLXA825gseI1Ck2OHlwukxEsneveEsWv',
        access_token: '934150673133920256-AzG2BsqDztoJrSDdlWYY2xVj9DbBn3U',
        access_token_secret: 'XgUmUaW2nyZl2yYOQXfnHcn5vX1ZNiDb0e2Oxgk6tYGIj'
    });



    var client = new Client(client_options);

    client.registerMethod('findAirportBoards', fxmlUrl + 'AirportBoards', 'GET');
    client.registerMethod('weatherConditions', fxmlUrl + 'WeatherConditions', 'GET');
    client.registerMethod('flightInfoStatus', fxmlUrl + 'FlightInfoStatus', 'GET');

    var findAirportBoardsArgs = {
        parameters: {
            airport_code: 'LIMC',
            howMany: 30
        }
    };




    client.methods.findAirportBoards(findAirportBoardsArgs, function (data, response) {

        var tailnumber_query;
        var flightAwareID;

        var howMany = findAirportBoardsArgs.parameters.howMany;
        var totRecords = 0;
        var counter;


        var tailnumber_array = [];
        var flightAwareID_array = [];


        for (counter = 0; counter < howMany; counter++) {

             tailnumber_query = data.AirportBoardsResult.enroute.flights[counter].tailnumber;
             flightAwareID = data.AirportBoardsResult.enroute.flights[counter].faFlightID;


             if (typeof (tailnumber_query) == 'string') {
                tailnumber_array[totRecords] = tailnumber_query;
                flightAwareID_array[totRecords] = flightAwareID;
                console.log(tailnumber_array[totRecords]);
                console.log(flightAwareID_array[totRecords]);

                totRecords++;


            } else console.log('Not yet defined');


        }

        console.log('Proceeding with screening');
        console.log('Valore di Tot records: ' + totRecords);

        var checkOnDatabase = function(loopValue, flightID) {
            MongoClient.connect(url, function (err, db) {
                var query = {tailnumber: loopValue};
                db.collection("planes").find(query).toArray(function (err, result) {
                    console.log(loopValue);
                    console.log(flightID);
                    console.log(result);
                    if (result[0] != null) {

                        var findFlightInfoStatusArgs = {
                            parameters: {
                                ident: flightID,
                                howMany: 1
                            }
                        };
                        console.log('findFlightInfoStatusArgs.parameters.ident ' + findFlightInfoStatusArgs.parameters.ident);
                        var tweetData;
                        client.methods.flightInfoStatus(findFlightInfoStatusArgs, function (data, response) {
                            tweetData = ('Flight ' + data.FlightInfoStatusResult.flights[0].ident + ' is coming from ' + data.FlightInfoStatusResult.flights[0].origin.alternate_ident + ' - ' + data.FlightInfoStatusResult.flights[0].origin.city + ' ' + data.FlightInfoStatusResult.flights[0].origin.airport_name + '. ');
                            tweetData = tweetData + ('STA is ' + data.FlightInfoStatusResult.flights[0].filed_arrival_time.time + ' ' + data.FlightInfoStatusResult.flights[0].filed_arrival_time.tz + ' and ETA is ' + data.FlightInfoStatusResult.flights[0].estimated_arrival_time.time + ' ' + data.FlightInfoStatusResult.flights[0].estimated_arrival_time.tz + ' on ' + data.FlightInfoStatusResult.flights[0].estimated_arrival_time.date + '. ');
                            tweetData = tweetData + ('Status is: ' + data.FlightInfoStatusResult.flights[0].status + '. ');
                            tweetData = tweetData + ('Aircraft type is: ' + data.FlightInfoStatusResult.flights[0].full_aircrafttype + ' with ' + result[0].livery);
                            console.log(tweetData);



                            MongoClient.connect(url, function (err, db) {
                                var query = {text: tweetData};
                                db.collection("tweetDataPosted").find(query).toArray(function (err, result) {
                                    if (result[0] == null) {

                                        MongoClient.connect(url, function (err, db) {
                                            if (err) throw err;
                                            var insertTime = new Date();
                                            console.log(insertTime);
                                            var myobj = {
                                                text: tweetData,
                                                timeOfCheck: insertTime
                                            };

                                            db.collection("tweetDataPosted").insertOne(myobj, function (err, res) {
                                                if (err) throw err;
                                                console.log("1 document inserted");
                                                db.close();
                                            });
                                        });

                                        twitter_BOT.post('statuses/update', {status: tweetData}, function (err, data, response) {
                                        });
                                    } else console.log('Already posted');
                                })

                                db.close();
                            });






                        })
                    }

                    db.close();
                })


            })

        };

        for (counter = 0; counter < totRecords; counter ++) {
            checkOnDatabase(tailnumber_array[counter], flightAwareID_array[counter]);
        }





    });












/*  (function wait () {
     if (flag == 1) {
         console.log("Timeout 2");
         setTimeout(wait, 5000);
     }
 })(); */
/*

            } else {
                console.log('Tailnumber is still undefined for ' + data.AirportBoardsResult.enroute.flights[counter].ident);
                flag = 0;
                i = i + 1;
            }

*/


         /*   function timeOut() {
                console.log('Timeout is running');
            }

            setTimeout(timeOut, 2000);


*/        /* enrouteData = (data.AirportBoardsResult.enroute.flights[counter].ident + ' with tailnumber ' + data.AirportBoardsResult.enroute.flights[counter].tailnumber + ' (' + data.AirportBoardsResult.enroute.flights[counter].aircrafttype + ') ');
            enrouteData = enrouteData + (' is coming from ' + data.AirportBoardsResult.enroute.flights[counter].origin.alternate_ident + ' - ' + data.AirportBoardsResult.enroute.flights[counter].origin.airport_name + '. ');
            enrouteData = enrouteData + ('Standard Arrival time is: ' + data.AirportBoardsResult.enroute.flights[counter].filed_arrival_time.time + ' ' + data.AirportBoardsResult.enroute.flights[counter].filed_arrival_time.tz + ' and Estimated Arrival Time is ' + data.AirportBoardsResult.enroute.flights[counter].estimated_arrival_time.time + ' ' + data.AirportBoardsResult.enroute.flights[counter].estimated_arrival_time.tz + '. ');
            enrouteData = enrouteData + ('Status of the flight is: ' + data.AirportBoardsResult.enroute.flights[counter].status + ' ');
 */


     /*  var arrival_flights = data.AirportBoardsResult.arrivals.flights;

        var transforms = {
            "flight_info" :[
                {"<>": "b", "html":"${ident}"},
                {"<>": "", "html":"${tailnumber}"},
                {"<>": "p", "html":"${origin.alternate_ident}"},
                {"<>": "p", "html":"${origin.airport_name}"},
                {"<>": "b", "html":"${full_aircrafttype}"}

            ]

        };



        var html1 = json2html.transform(arrival_flights,transforms.flight_info);

        console.log(html1);

    */
        /*  http.createServer(fuction (req, res) {
            res.write('<html><head></head><body>');
            res.write('Flight Stats' + html1);
            res.end('</body></html>');
        }).listen(8080);

        */





