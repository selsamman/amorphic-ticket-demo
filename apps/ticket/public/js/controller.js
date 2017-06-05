"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var amorphic_1 = require("amorphic");
var baseController_1 = require("./baseController");
var ticketItemComment_1 = require("../../../common/js/ticketItemComment");
var ticket_1 = require("../../../common/js/ticket");
var _ = require("underscore");
var person_1 = require("../../../common/js/person");
var project_1 = require("../../../common/js/project");
var secure_1 = require("../../../common/js/secure");
var forceImport = ticketItemComment_1.TicketItemComment;
var Controller = (function (_super) {
    __extends(Controller, _super);
    function Controller() {
        // Global properties
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.page = '';
        _this.file = '';
        _this.error = '';
        _this.status = '';
        // References to the model
        _this.ticket = null; // unlike with supertype properties are not 'ownProperty'
        _this.person = null;
        _this.loggedInPerson = null;
        _this.project = null;
        // Temporary fields
        _this.comment = ''; // When adding a comment to a ticket
        return _this;
        /**
         * Security check on remote calls is execute from semotus before executing a call on the server
         *
         * @param functionName
         * @returns {Boolean} - whether to proceed with call
        validateServerCall (functionName)
        {
            if (functionName.match(/^public/))
                return true;
            return this.loggedIn ? true : false;
        }
         */
    }
    Controller.prototype.serverInit = function () {
        amorphic_1.amorphicStatic.logger.info({ userConfig: amorphic_1.amorphicStatic.config.userConfig }, 'logging from static');
        this.secure = new secure_1.Secure();
    };
    Controller.prototype.ticketsFetch = function () {
        this.amorphic.logger.info({}, 'fetching tickets');
        this['ticketsPersistor'] = { isFetching: false, isFetched: true };
        return ticket_1.Ticket.getFromPersistWithQuery({}).then(function (tickets) {
            this.tickets = tickets;
            console.log(tickets[0].toJSONString());
        }.bind(this));
    };
    ;
    Controller.prototype.peopleFetch = function () {
        this['peoplePersistor'] = { isFetching: false, isFetched: true };
        return person_1.Person.getFromPersistWithQuery({}).then(function (people) {
            this.people = people;
        }.bind(this));
    };
    ;
    Controller.prototype.projectsFetch = function () {
        this['projectsPersistor'] = { isFetching: false, isFetched: true };
        return project_1.Project.getFromPersistWithQuery({}).then(function (projects) {
            this.projects = projects;
        }.bind(this));
    };
    ;
    /*
     * -------  Ticket functions ----------------------------------------------------------------
     */
    // Create a new ticket and make it current
    Controller.prototype.newTicket = function () {
        this.amorphic.logger.error({}, 'creating new ticket');
        if (!this.ticket || this.ticket.created) {
            this.ticket = new ticket_1.Ticket();
            if (_.indexOf(this.tickets, this.ticket) < 0)
                this.tickets.splice(0, 0, this.ticket);
            this.error = null;
        }
        this.route.private.ticket();
    };
    ;
    Controller.prototype.addComment = function () {
        return this.ticket.addComment(this.comment, this.loggedInPerson).persistSave()
            .then(function () {
            this.comment = '';
        }.bind(this));
    };
    // Ask the ticket to save itself and update our list of tickets
    Controller.prototype.saveTicket = function () {
        if (this.ticket)
            return this.ticket.save().then(function (error) {
                this.status = "Ticket Saved at " + this.getDisplayTime();
                this.error = null;
            }.bind(this));
    };
    ;
    // Ask the ticket to remove itself and update our list of tickets
    Controller.prototype.deleteTicket = function () {
        if (this.ticket)
            return this.ticket.remove().then(function () {
                var ix = _.indexOf(this.tickets, this.ticket); // Remove from list
                if (ix >= 0)
                    this.tickets.splice(ix, 1);
                this.ticket = null;
            }.bind(this));
    };
    ;
    /*
     * -------  Project functions ----------------------------------------------------------------
     */
    Controller.prototype.deletePerson = function (person) {
        //if (this.isAdmin()) {
        person.remove().then(function () {
            this.createAdmin();
            if (this.loggedInPerson == person)
                this.logout('');
        }.bind(this));
        //}
    };
    ;
    /*
     * -------  General Functions ----------------------------------------------------------------
     */
    Controller.prototype.deleteAll = function () {
        // This could start a lot of asynchronous activity.  In the real world you would not do this
        // but in the real world you would not have a deleteAll() :-)
        //if (this.isAdmin()) {
        this.projectsFetch().then(function () {
            _.map(this.projects, function (project) {
                this.project = project;
                this.deleteProject();
            }.bind(this));
            return this.ticketsFetch();
        }.bind(this)).then(function () {
            _.map(this.tickets, function (ticket) {
                this.ticket = ticket;
                this.deleteTicket();
            }.bind(this));
            return this.personsFetch();
        }.bind(this)).then(function () {
            _.map(this.person, function (person) {
                if (person != this.person)
                    this.deletePerson(person);
            }.bind(this));
            this.logout('');
        }.bind(this));
        //}
    };
    ;
    /**
     * If no admin's present create one
     */
    Controller.prototype.publicInitAll = function () {
        //this.createAdmin();
    };
    ;
    // create a new project to be saved later
    Controller.prototype.newProject = function () {
        if (!this.project || this.project.created) {
            this.project = new project_1.Project("", "");
            if (_.indexOf(this.projects, this.project) < 0)
                this.projects.splice(0, 0, this.project);
            this.error = null;
        }
        this.route.private.project();
    };
    Controller.prototype.saveProject = function () {
        if (this.project)
            return this.project.save(this.person).then(function () {
                this.status = "Project saved at " + this.getDisplayTime();
                this.error = "";
            }.bind(this));
    };
    ;
    Controller.prototype.deleteProject = function () {
        if (this.project)
            return this.project.remove().then(function () {
                var ix = _.indexOf(this.projects, this.project);
                if (ix >= 0)
                    this.projects.splice(ix, 1);
                console.log("Deleting " + this.project.__id__ + " " + this.project.name);
                this.project = null;
            }.bind(this));
    };
    ;
    /*
     * -------  Housekeeping ----------------------------------------------------------------------
     */
    Controller.prototype.clientInit = function () {
        baseController_1.BaseController.prototype.clientInit.call(this);
        this.router = AmorphicRouter;
        this.route = AmorphicRouter.route(this, ticketRoutes);
    };
    Controller.prototype.login = function () {
        this.publicLogin().then(function () {
            if (this.loggedIn) {
                this.setPage('home');
            }
        }.bind(this));
    };
    Controller.prototype.registerPrincipal = function (principal) {
        this.loggedInPerson = principal;
    };
    Controller.prototype.logout = function () {
        // Ideally for security purposes and to prevent leaks there should be a controller reset capability
        this.people = null;
        this.project = null;
        this.projects = null;
        this.ticket = null;
        this.tickets = null;
        //this.publicLogout('home');
    };
    ;
    /**
     * Called if an error thrown on server call that is not handled
     */
    Controller.prototype.handleRemoteError = function (error) {
        //this.error = this.getErrorMessage(error);
    };
    ;
    /**
     * Setup the controller to display a given file
     * @param page
     * @param file
     */
    Controller.prototype.pageInit = function (file) {
        //this.password = "";
        //this.newPassword = "";
        //this.confirmPassword = "";
        //this.error = "";
    };
    ;
    /**
     * Set the current page
     *
     * @param page (router path but without the initial slash needed)
     */
    Controller.prototype.setPage = function (page) {
        this.router.goTo(page);
    };
    ;
    Controller.prototype.isPage = function (name) {
        return this.page == name;
    };
    ;
    Controller.prototype.log = function (level, text) {
        //(this.__template__.objectTemplate).log(level, text);
    };
    ;
    Controller.prototype.getDisplayTime = function () {
        var date = new Date();
        return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + " " +
            date.toTimeString().replace(/ .*/, '');
    };
    ;
    return Controller;
}(baseController_1.BaseController));
__decorate([
    amorphic_1.property({ getType: function () { return secure_1.Secure; } }),
    __metadata("design:type", secure_1.Secure)
], Controller.prototype, "secure", void 0);
__decorate([
    amorphic_1.property(),
    __metadata("design:type", String)
], Controller.prototype, "page", void 0);
__decorate([
    amorphic_1.property(),
    __metadata("design:type", String)
], Controller.prototype, "file", void 0);
__decorate([
    amorphic_1.property(),
    __metadata("design:type", String)
], Controller.prototype, "error", void 0);
__decorate([
    amorphic_1.property(),
    __metadata("design:type", String)
], Controller.prototype, "status", void 0);
__decorate([
    amorphic_1.property(),
    __metadata("design:type", ticket_1.Ticket)
], Controller.prototype, "ticket", void 0);
__decorate([
    amorphic_1.property({ autoFetch: true, type: ticket_1.Ticket }),
    __metadata("design:type", Array)
], Controller.prototype, "tickets", void 0);
__decorate([
    amorphic_1.remote(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Controller.prototype, "ticketsFetch", null);
__decorate([
    amorphic_1.property(),
    __metadata("design:type", person_1.Person)
], Controller.prototype, "person", void 0);
__decorate([
    amorphic_1.property(),
    __metadata("design:type", person_1.Person)
], Controller.prototype, "loggedInPerson", void 0);
__decorate([
    amorphic_1.property({ type: person_1.Person, autoFetch: true }),
    __metadata("design:type", Array)
], Controller.prototype, "people", void 0);
__decorate([
    amorphic_1.remote(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Controller.prototype, "peopleFetch", null);
__decorate([
    amorphic_1.property(),
    __metadata("design:type", project_1.Project)
], Controller.prototype, "project", void 0);
__decorate([
    amorphic_1.property({ type: project_1.Project, autoFetch: true }),
    __metadata("design:type", Array)
], Controller.prototype, "projects", void 0);
__decorate([
    amorphic_1.remote(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Controller.prototype, "projectsFetch", null);
__decorate([
    amorphic_1.property(),
    __metadata("design:type", String)
], Controller.prototype, "comment", void 0);
__decorate([
    amorphic_1.remote(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Controller.prototype, "addComment", null);
__decorate([
    amorphic_1.remote({ validate: function () { return this.validate(); } }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Controller.prototype, "saveTicket", null);
__decorate([
    amorphic_1.remote(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Controller.prototype, "deleteTicket", null);
__decorate([
    amorphic_1.remote(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Controller.prototype, "deletePerson", null);
__decorate([
    amorphic_1.remote(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Controller.prototype, "deleteAll", null);
__decorate([
    amorphic_1.remote(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Controller.prototype, "publicInitAll", null);
__decorate([
    amorphic_1.remote(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Controller.prototype, "saveProject", null);
__decorate([
    amorphic_1.remote({ on: 'client' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Controller.prototype, "setPage", null);
Controller = __decorate([
    amorphic_1.supertypeClass
], Controller);
exports.Controller = Controller;
//# sourceMappingURL=controller.js.map