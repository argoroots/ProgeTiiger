function cl(d) {
    console.log(d)
}



function getSignedData(user, key, data) {
    if(!user || !key) return

    var conditions = []
    for(k in data) {
        conditions.push({k: data[k]})
    }

    var expiration = new Date()
    expiration.setMinutes(expiration.getMinutes() + 10)

    data['user'] = user
    data['policy'] = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify({expiration: expiration.toISOString(), conditions: conditions})))
    data['signature'] = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(data['policy'], key))

    return data
}



function makeKey() {
    var text = ''
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    for(var i=0; i < 64; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}



var PAGE_URL          = 'http://hitsa.github.io/ProgeTiiger/'
var API_URL           = 'https://hitsa.entu.ee/api2/'
var API_USER          = 746
var API_KEY           = 'qb8z5GGdFxvnMKxRN6N3vuj3kUB47LKk'

angular.module('pdApp', ['ngRoute', 'ngResource'])



// ROUTER
    .config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
        // $locationProvider.html5Mode(true)
        $routeProvider
            .when('/voting', {
                templateUrl: 'start',
                controller: 'startCtrl'
            })
            .when('/voting/:voter_id/:voter_key', {
                templateUrl: 'voting',
                controller: 'votingCtrl'
            })
            .otherwise({
                redirectTo: '/voting'
            })
    }])



// START
    .controller('startCtrl', ['$scope', '$http', function($scope, $http) {
        $scope.sendLink = function() {
            if(!$scope.email) return

            $scope.sending = true
            $scope.key = makeKey()
            $http({
                    method : 'POST',
                    url    : API_URL + 'entity-747',
                    data   : getSignedData(API_USER, API_KEY, {
                        'definition': 'pd-voter',
                        'pd-voter-entu-api-key': $scope.key
                    })
                })
                .success(function(data) {
                    $scope.id = data.result.id
                    $http({
                            method : 'POST',
                            url    : API_URL + 'entity-' + $scope.id + '/rights',
                            data   : getSignedData(API_USER, API_KEY, {
                                'entity': $scope.id,
                                'right': 'expander'
                            })
                        })
                        .success(function(data) {
                            var url = PAGE_URL + '#/voting/' + $scope.id + '/' + $scope.key
                            $http({
                                    method : 'POST',
                                    url    : API_URL + 'entity-' + $scope.id + '/rights',
                                    data   : getSignedData(API_USER, API_KEY, {
                                        'entity': API_USER
                                    })
                                })
                                .success(function(data) {
                                    $http({
                                            method : 'POST',
                                            url    : API_URL + 'email',
                                            data   : getSignedData(API_USER, API_KEY, {
                                                'to': $scope.email,
                                                'subject': 'ProgeTiiger õpilaskonkurss "Tuleviku õpperuum 2050" hääletus',
                                                'message': 'Siin on teie personaalne link ProgeTiiger õpilaskonkurss "Tuleviku õpperuum 2050" hääletusele.<br>\n<br>\n<a href="' + url + '">' + url + '</a><br>\n<br>\nÄrge seda linki jagage!'
                                            })
                                        })
                                        .success(function(data) {
                                            $scope.sending = false
                                            $scope.sent = true
                                        })
                                        .error(function(data) {
                                            $scope.sending = false
                                        })
                                })
                                .error(function(data) {
                                    $scope.sending = false
                                })
                        })
                        .error(function(data) {
                            $scope.sending = false
                        })
                })
                .error(function(data) {
                    $scope.sending = false
                })
        }
    }])



// VOTING
    .controller('votingCtrl', ['$scope', '$http', '$routeParams', '$location', '$timeout', function($scope, $http, $routeParams, $location, $timeout) {

        $scope.works = []
        $scope.categories = {}
        $scope.agegroups = {}

        $http({
                method : 'GET',
                url    : API_URL + 'entity-' + $routeParams.voter_id,
                params : getSignedData($routeParams.voter_id, $routeParams.voter_key, {})
            })
            .success(function(data) {
                $http({
                        method : 'GET',
                        url    : API_URL + 'entity-749/childs',
                        params : getSignedData(API_USER, API_KEY, {
                            definition: 'pd-work',
                            limit: '1000'
                        })
                    })
                    .success(function(data) {
                        for (id in data.result['pd-work'].entities) {
                            $http({
                                    method : 'GET',
                                    url    : API_URL + 'entity-' + data.result['pd-work'].entities[id].id,
                                    params : getSignedData(API_USER, API_KEY, {})
                                })
                                .success(function(data) {
                                    $scope.works.push({
                                        category     : data.result.properties.category.values[0].value,
                                        title        : data.result.properties.title.values[0].value,
                                        author       : data.result.properties.author.values[0].value,
                                        organization : data.result.properties.organization .values[0].value,
                                        url          : data.result.properties.url.values[0].value,
                                        agegroup     : data.result.properties.agegroup.values[0].value
                                    })
                                    $scope.categories[data.result.properties.category.values[0].value] = null
                                    $scope.agegroups[data.result.properties.agegroup.values[0].value] = null
                                })
                                .error(function(data) {
                                    cl(data.error)
                                })
                        }
                    })
                    .error(function(data) {
                        cl(data)
                        $location.path('/')
                    })
            })
            .error(function(data) {
                $location.path('/voting')
            })

    }])