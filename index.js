var speedtest = require('speedtest.net');
var graphite = require('graphite');

process.chdir(__dirname);

if(!require('fs').existsSync('./config.json')){
	console.error('Missing config.json. See config.json.example.');
	process.exit(1);
}

var config = require('./config');

var graphiteClient = graphite.createClient("plaintext://"+config.graphite.host+":"+config.graphite.port+"/");

main();

function main(){
	var testInterval = setInterval(runTest, config.testIntervalMillis);
	runTest();
}

function runTest(){
	speedtest.runTest(onTestComplete);
}
	
function onTestComplete(testResult){
	if(testResult){
		var uploadMegabitsPerSecond = testResult.upload;
		var downloadMegabitsPerSecond = testResult.download;
		
		console.log("\n"+new Date()+"\ndownload: "+downloadMegabitsPerSecond+" megabits/s\nupload: "+uploadMegabitsPerSecond+" megabits/second");

		var metricsObject = {};
		metricsObject[config.graphite.key] = {
			upload: uploadMegabitsPerSecond,
			download: downloadMegabitsPerSecond
		};
		graphiteClient.write(metricsObject, function(err){
			if(err != null){
				console.warn("failed to write metrics to graphite", err);
			}
		});
	} else {
		console.error("speedtest returned null, oh well");
	}
}
