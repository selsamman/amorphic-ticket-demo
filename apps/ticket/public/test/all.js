describe("Quick Run Through", function () {
    mocha.setup({ignoreLeaks: true});
    this.timeout(10000);

    it ("can login", function(done) {
        (controller.loggedIn ?
            bindster.DOMClick({text: "Logout", defer: "page"}).then( function() {
                expect(bindster.DOMFind({text: "Hello"})).to.equal(false);
                return Q(true);
            }) : Q(true)
        ).then (function () {
            return bindster.DOMClick({text: "Login", defer: "page"});
        }).then( function() {
            expect(bindster.DOMFind({text: "Password"})).to.equal(true);
            bindster.DOMSet({bind: "email", value: "amorphic@amorphic.com"});
            bindster.DOMSet({bind: "password", value: "admin"});
            return bindster.DOMClick({text: "Login", type: "button", defer: "page"});
        }).then( function () {
            setTimeout(function (){done()}, 2000);
        }).fail(function(e){done(e)});
    });


/*
    afterEach(function (done)  {
        bindster.DOMClick({href: "#", defer: "page"}).then( function () {
            done();
        }).fail(function(e){done(e)});
    });

    it ("Basic Navigation", function(done) {
        bindster.DOMClick({text: "How it Works", defer: "page"}).then( function() {
            expect(bindster.DOMFind({text: "Bank-level website security"})).to.equal(true);
            return bindster.DOMClick({text: "About Us", defer: "page"});
        }).then( function () {
            expect(bindster.DOMFind({text: "We believe in customer service, not sales."})).to.equal(true);
            done();
        }).fail(function(e){done(e)});
    });


    it("Single No Kids", function (done) {
        bindster.DOMClick({text: "Get Started", defer: "page"}).then( function() {
            bindster.DOMSet({bind: "primaryCustomer.firstName", value: "Sam"});
            bindster.DOMSet({bind: "profile.relationship", value: "single"});
            bindster.DOMSet({bind: "profile.numberOfChildren", value: "0"});
            bindster.DOMClick({text: "Go"});
            bindster.DOMClick({text: "The Pragmatist"});
            return bindster.DOMClick({text: "That's Me", defer: "page"})
        }).then( function () {
            bindster.DOMSet({bind: "capitalNeeds.earnedIncome[0].amount", value: "50K"})
            bindster.DOMClick({text: "Finished"})
            bindster.DOMClick({text: "close hints"});
            expect($(".coverageSummary .box2").text()).to.equal("$0");
            done();
        }).fail(function(e){done(e)});
    });

    it("Single With 2 Kids", function (done) {
        bindster.DOMClick({text: "Get Started", defer: "page"}).then( function() {
            bindster.DOMSet({bind: "primaryCustomer.firstName", value: "Sam"});
            bindster.DOMSet({bind: "profile.relationship", value: "single"});
            bindster.DOMSet({bind: "profile.numberOfChildren", value: "2"});
            bindster.DOMClick({text: "Go"});
            bindster.DOMClick({text: "The Pragmatist"});
            return bindster.DOMClick({text: "That's Me", defer: "page"})
        }).then( function () {
            bindster.DOMSet({bind: "capitalNeeds.earnedIncome[0].amount", value: "50K"})
            bindster.DOMClick({text: "Finished"})
            bindster.DOMClick({text: "close hints"});
            expect(bindster.DOMGet({bind: "capitalNeeds.getCoverage(false)"})).to.equal("$300,000");
            done();
        }).fail(function(e){done(e)});
    });

    it("Married With 2 Kids", function (done) {
        bindster.DOMClick({text: "Get Started", defer: "page"}).then( function() {
            bindster.DOMSet({bind: "primaryCustomer.firstName", value: "Sam"});
            bindster.DOMSet({bind: "profile.relationship", value: "married"});
            bindster.DOMSet({bind: "alternateCustomer.firstName", value: "Karen"});
            bindster.DOMSet({bind: "profile.numberOfChildren", value: "2"});
            bindster.DOMClick({text: "Go"});
            bindster.DOMClick({text: "The Pragmatist"});
            return bindster.DOMClick({text: "That's Me", defer: "page"})
        }).then( function () {
            bindster.DOMSet({bind: "capitalNeeds.earnedIncome[0].amount", value: "100K"})
            bindster.DOMSet({bind: "capitalNeeds.earnedIncome[1].amount", value: "50K"})
            bindster.DOMClick({text: "Finished"})
            bindster.DOMClick({text: "close hints"});
            expect(bindster.DOMGet({bind: "capitalNeeds.getCoverage(false)"})).to.equal("$800,000");
            expect(bindster.DOMGet({bind: "capitalNeeds.getCoverage(true)"})).to.equal("$200,000");
            done();
        }).fail(function(e){done(e)});
    });
*/
});