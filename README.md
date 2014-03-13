Semotus is a framework for creating object-oriented web-based applications in nodeJS and mongoDB.

The key features include:

- A robust type system that supports object references and collections

- An object broker to keep object instances in sync between browser and server

- An ORM that persists the objects to MongoDB

- An application container for nodeJS to run the whole thing in


Here is a quick example to illustrate the style of code:
````
Foo = RemoteObjectTemplate.create("Foo",
{
	field1:  {type: String},

	init: function (val) {
		this.field1 = val;
	}
});

Bar = RemoteObjectTemplate..create("Bar",
{
	foos:  {type: Array, of: Foo},

	serverLogFoos: {on: "server", body: function () {
		for (var ix = 0; ix < this.foos.length; ++ix)
			console.log(this.foos[ix].field1);
	}}
});


// Browser code

Controller = RemoteObjectTemplate.create("Controller", {
	bar: {type: Bar},
	clientInit: function () {
		this.bar = new Bar();
		this.bar.foos.push(new Foo("One"));
		this.bar.foos.push(new Foo("Two"));
		this.bar.serverLogFoos();  // Will log "one" "Two" on nodejs console
	}
});
````
This project is alpha.  While it has been used to build a large and complex nodeJS application it has not undergone the rigor of being used on a breadth of projects and as such may not cater to all use cases.  It is also subject to change and currently does not have formal documentation.
The repository structure is currently in the form of a sample application and this may also change.  If you want to see the app hosted it is here http://semotus.nodejitsu.com/

