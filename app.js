var sys = require('sys');
var exec = require('child_process').exec;
var fs = require('fs');
var Q = require('q');
var url = require('url');
var MongoClient = require('mongodb').MongoClient;
var connect = require('connect');
var http = require('http');
var https = require('https');
var semotus = require('semotus');

// Configuraiton file
var nconf = require('nconf');
nconf.argv().env();
nconf.file('checkedin', 'config.json');
nconf.file('local', 'config_secure.json');

// Global varibles
var sessionExpiration = nconf.get('sessionSeconds') * 1000;
var objectCacheExpiration = nconf.get('objectCacheSeconds') * 1000;
var dbname = nconf.get('dbname');

// We use memory store because the only leak condition is that sessions don't expire unless referenced.
// and the controller caching mechanism in semotus references the session to expire it's own cache
// which takes care of session garbage collection.  Clearly a session store based on something like
// redis is more desirable
var MemoryStore = connect.session.MemoryStore;
var memoryStore = new MemoryStore;
var sessionRouter = connect.session(
    {store: memoryStore, secret: 'Ey0veeljPcLsHitdxCG2',
    cookie: {maxAge: sessionExpiration}, rolling: true}
);

// Initialize applications

var appList = nconf.get('applications');
var mainApp = nconf.get('application');
var promises = [];
for (var app in appList)
{
	var path = appList[app];
	var config = JSON.parse(fs.readFileSync(path + "/config.json").toString());
    config.nconf = nconf; // global config
	var schema = JSON.parse(fs.readFileSync(path + "/schema.json").toString());

	var dbName = nconf.get(app + '_dbName') || config.dbName;
	var dbPath = nconf.get(app + '_dbPath') || config.dbPath;

	promises.push(
		Q.ninvoke(MongoClient, "connect", dbPath + dbName).then (function (db)
        {
			console.log("DB connection established to " + dbName);
			function injectObjectTemplate (objectTemplate) {
				objectTemplate.setDB(db);
				objectTemplate.setSchema(schema);
				objectTemplate.config = config;
				objectTemplate.logLevel = nconf.get('logLevel') || 1;
			}

			semotus.establishApplication(app, path + '/public/js/controller.js', injectObjectTemplate,
				sessionExpiration, objectCacheExpiration, memoryStore, null, config.ver, config);

			return Q.fcall(function(){return true});
		})
	);
}

Q.all(promises).then( function ()
{
	var app = connect();

    for (var appName in appList) {
        var url = appName == mainApp ? "/" : "/" + appName;
        var path = __dirname + "/" + appList[appName] + "/public";
        app.use(url, connect.static(path,{index: "index.html"}));
        console.log("Url " + url + " connected to " + path);
    }

    app
    .use('/modules/', connect.static(__dirname + "/node_modules"))
    .use('/semotus/', connect.static(__dirname + "/node_modules/semotus"))
    .use(connect.cookieParser())
	.use(connect.bodyParser())
	.use(sessionRouter)
	.use('/semotus/init/' , function (request, response) {
		  console.log ("Requesting " + request.originalUrl);
		  if(request.originalUrl.match(/([A-Za-z0-9_]*)\.js/)) {
			  var appName = RegExp.$1;
			  console.log("Establishing " + appName);
			  semotus.establishServerSession(request, appName, "initial")
			  .then (function (session) {
				  response.setHeader("Content-Type", "application/javascript");
				  response.setHeader("Cache-Control", "public, max-age=0");
				  response.end(
                      "semotus.setConfig(" + session.getServerConfigString() +");" +
                      "semotus.setInitialMessage(" + session.getServerConnectString() +");"
                  );
			  }).done();
		  }
	 })
	.use(semotus.router);


	app.listen(nconf.get('port'));
});