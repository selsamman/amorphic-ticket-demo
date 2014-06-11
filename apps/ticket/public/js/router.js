AmorphicRouter.route(controller, {
    enter: function (route) {
        this.page = route.__route;
        this.file = route.__file;
        this.pageInit();
    },
    routes: {
        public: {
            path: '',
            routes: {
                default: {path: '', file: null},
                home: {file: null},

                login: {file: "modules/amorphic-userman/pages/login.html"},
                registration: {file: "modules/amorphic-userman/pages/registration.html"},
                registration_instructions: {file: "modules/amorphic-userman/pages/registration_instructions.html"},
                registration_confirmation: {file: "modules/amorphic-userman/pages/registration_confirmation.html"},

                change_email: {file: "modules/amorphic-userman/pages/change_email.html"},
                change_email_confirmation: {file: "modules/amorphic-userman/pages/change_email_confirmation.html"},
                change_password: {file: "modules/amorphic-userman/pages/change_password.html"},
                change_password_confirmation: {file: "modules/amorphic-userman/pages/change_password_confirmation.html"},

                reset_password_request: {file: "modules/amorphic-userman/pages/reset_password_request.html"},
                reset_password_instructions: {file: "modules/amorphic-userman/pages/reset_password_instructions.html"},
                reset_password: {file: "modules/amorphic-userman/pages/reset_password.html"},
                reset_password_confirmation: {file: "modules/amorphic-userman/pages/reset_password_confirmation.html"},

                reset_password_from_code: {
                    file: "modules/amorphic-userman/pages/reset_password.html",
                    parameters: {
                        email: {bind: "email"},
                        token: {bind: "passwordChangeHash"}
                    }
                },
                verify_email: {
                    file: '',
                    parameters: {
                        email: {bind: "email"},
                        code: {bind: "verifyEmailCode"}
                    },
                    enter: function () {
                        this.publicVerifyEmailFromCode('registration_confirmation');
                    }
                },
                init_all: {enter: function () {controller.publicInitAll()}}
            }
        },
        private: {
            path: '',
            enter: function (route) {
                if (!this.loggedIn)
                    this.router.goTo('');
            },
            routes: {
                people: {file: "people.html"},
                tickets: {file: "tickets.html"},
                ticket: {file: "ticket.html"},
                projects: {file: "projects.html"},
                project: {file: "project.html"},
                delete_all: {enter: function () {controller.deleteAll()}}
            }
        }
    }
});

controller.routerInit(AmorphicRouter);

