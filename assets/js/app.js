/**
 * Created by olucurious on 08/06/2017.
 */

/*
DISCLAIMER:
THIS IS A JUMBLED ANGULARJS CODE
IT WAS A SORT OF HACK TO GET SOMETHING TO WORK IN A SHORT PERIOD OF TIME
*/

(function () {
    'use strict';
    var CWITTER_API = "http://localhost:8080";
    //var CWITTER_API = "https://limitless-journey-77277.herokuapp.com";
    angular
        .module('CweetApp', ['ngRoute', 'ngCookies', 'angularMoment'])
        .config(config);
    angular
        .module('CweetApp').service('authInterceptor', function ($q, $location, $cookies) {
        var service = this;
        service.responseError = function (response) {
            if (response.status === 401) {
                $cookies.remove('cweet_user');
                $location.path('/signin');
            }
            return $q.reject(response);
        };
    });
    config.$inject = ['$routeProvider', '$httpProvider'];
    function config($routeProvider, $httpProvider) {
        $httpProvider.defaults.withCredentials = true;
        $httpProvider.interceptors.push('authInterceptor');
        $routeProvider
            .when('/', {
                controller: 'CweetController',
                templateUrl: 'views/timeline.html',
                controllerAs: 'vm'
            })

            .when('/signin', {
                controller: 'SignInController',
                templateUrl: 'views/signin.html',
                controllerAs: 'vm'
            })

            .when('/signup', {
                controller: 'SignUpController',
                templateUrl: 'views/signup.html',
                controllerAs: 'vm'
            })

            .when('/signout', {
                controller: 'SignOutController',
                templateUrl: 'views/signin.html',
                controllerAs: 'vm'
            })

            .when('/user/:uId', {
                controller: 'ProfileController',
                templateUrl: 'views/profile.html',
                controllerAs: 'vm'
            })

            .otherwise({redirectTo: '/signin'});
    }

    angular
        .module('CweetApp').directive('cweet', function () {
        return {
            restrict: 'E',
            templateUrl: 'views/cweet.html',
        };
    });


    angular
        .module('CweetApp')
        .factory('CweetService', CweetService);


    CweetService.$inject = ['$http'];
    function CweetService($http) {
        var service = {};

        service.GetTimeline = GetTimeline;
        service.SignUpUser = SignUpUser;
        service.SignInUser = SignInUser;
        service.SignOutUser = SignOutUser;
        service.PostCweet = PostCweet;
        service.GetUserTimeline = GetUserTimeline;

        return service;

        function GetTimeline() {
            return $http.get(CWITTER_API + '/cweet/timeline').then(handleSuccess, handleError('Error fetching global timeline'));
        }

        function GetUserTimeline(data) {
            return $http.post(CWITTER_API + '/cweet/profile', data).then(handleSuccess, handleError('Error fetching user timeline'));
        }

        function PostCweet(data) {
            return $http.post(CWITTER_API + '/cweet/new', data).then(handleSuccess, handleError('Error verifying provided details'));
        }

        function SignUpUser(data) {
            return $http.post(CWITTER_API + '/auth/signup', data).then(handleSuccess, handleError('Error creating new account'));
        }

        function SignInUser(data) {
            return $http.post(CWITTER_API + '/auth/signin', data).then(handleSuccess, handleError('Error verifying user login'));
        }

        function SignOutUser(data) {
            return $http.post(CWITTER_API + '/auth/signout', data).then(handleSuccess, handleError('Error signing out user'));
        }

        // private functions

        function handleSuccess(res) {
            return res.data;
        }

        function handleError(error) {
            return function () {
                return {success: false, message: error};
            };
        }
    }


    angular
        .module('CweetApp')
        .controller('CweetController', CweetController);

    CweetController.$inject = ['$location', '$rootScope', 'CweetService'];
    function CweetController($location, $rootScope, CweetService) {
        var vm = this;

        CweetService.GetTimeline().then(function (data) {
            vm.cweetFeed = data.data;
            $rootScope.currentUser = data.user;
            $rootScope.message = '';
        });

        vm.addTweet = function () {
            var data = {"text": vm.cweetText};
            CweetService.PostCweet(data).then(function (data) {
                if (data.status === "success") {
                    vm.cweetText = '';
                    vm.cweetFeed.push(data.data);
                }
            });
        };
    }


    angular
        .module('CweetApp')
        .controller('SignInController', SignInController);

    SignInController.$inject = ['$location', '$rootScope', 'CweetService'];
    function SignInController($location, $rootScope, CweetService) {
        var vm = this;

        vm.login = function () {
            var data = {"email": vm.user.email, "pword": vm.user.pword};
            CweetService.SignInUser(data).then(function (response) {
                if (response.status === "success") {
                    $rootScope.currentUser = response.data;
                    $location.path('/');
                } else {
                    $rootScope.message = response.message;
                }
            });
        };
    }


    angular
        .module('CweetApp')
        .controller('SignOutController', SignOutController);

    SignOutController.$inject = ['$location', '$rootScope', '$cookies', 'CweetService'];
    function SignOutController($location, $rootScope, $cookies, CweetService) {
        var data = {"email": $rootScope.currentUser.email, "user_id": $rootScope.currentUser.user_id};
        CweetService.SignOutUser(data).then(function (response) {
            if (response.status === "success") {
                $rootScope.currentUser = null;
                $cookies.remove('cweet_user');
                $location.path('/');
            } else {
                $rootScope.message = response.message;
            }
        });
    }


    angular
        .module('CweetApp')
        .controller('SignUpController', SignUpController);

    SignUpController.$inject = ['$location', '$rootScope', 'CweetService'];
    function SignUpController($location, $rootScope, CweetService) {
        var vm = this;
        $rootScope.message = '';
        vm.register = function () {
            var data = {
                "first_name": vm.user.first_name,
                "last_name": vm.user.last_name,
                "email": vm.user.email,
                "pword": vm.user.pword
            };
            CweetService.SignUpUser(data).then(function (response) {
                if (response.status === "success") {
                    $rootScope.currentUser = response.data;
                    $location.path('/');
                } else {
                    $rootScope.message = response.message;
                }
            });
        };
    }


    angular
        .module('CweetApp')
        .controller('ProfileController', ProfileController);

    ProfileController.$inject = ['$routeParams', '$rootScope', 'CweetService', '$location'];
    function ProfileController($routeParams, $rootScope, CweetService, $location) {
        var vm = this;
        var userProfileId = $routeParams.uId;
        var data = {"user_id": userProfileId};

        CweetService.GetUserTimeline(data).then(function (data) {

            $rootScope.currentUser = data.user;
            if (data.status === "success"){
                vm.cweetFeed = data.data;
                vm.userName = data.profile_user.first_name;
            } else {
                // redirect you to the homepage because that's what you deserve for trying to check a profile that doesn't exist
                $location.path('/');
            }
        });
    }

})();
