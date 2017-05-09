var PAGE_URL = 'http://konkurss.progetiiger.ee/'
var API_URL  = 'https://hitsa.entu.ee/api2/'
var API_USER = 746
var API_KEY  = 'qb8z5GGdFxvnMKxRN6N3vuj3kUB47LKk'
var ENTITY_VOTERS = 3773
var ENTITY_WORKS = 749



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

function md5(data) {
    return CryptoJS.enc.Hex.stringify(CryptoJS.MD5(data))
}

function makeKey() {
    var text = ''
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    for(var i=0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

function mySort(array, attribute) {
    array.sort(function(a, b){
        if(a[attribute].toUpperCase() > b[attribute].toUpperCase()) return 1
        if(a[attribute].toUpperCase() < b[attribute].toUpperCase()) return -1
    })
    return array
}



angular.module('pdApp', ['ngRoute', 'ngResource'])



// ROUTER
    .config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
        $locationProvider.html5Mode(true)
        $routeProvider
            .when('/voting', {
                templateUrl: 'start',
                controller: 'startCtrl'
            })
            .when('/voting/:voter_id/:voter_key', {
                templateUrl: 'voting',
                controller: 'votingCtrl'
            })
            .when('/end', {
                templateUrl: 'end',
            })
            .otherwise({
                redirectTo: '/voting'
            })
            // .otherwise({
            //     redirectTo: '/end'
            // })
    }])

    .filter('orderObjectBy', function(){
         return function(input, attribute) {
            if (!angular.isObject(input)) return input

            var array = []
            for(var objectKey in input) {
                array.push(input[objectKey])
            }

            array.sort(function(a, b){
                a = parseInt(a[attribute])
                b = parseInt(b[attribute])
                return a - b
            })
            return array
         }
    })



// START
    .controller('startCtrl', ['$scope', '$http', function($scope, $http) {
        $scope.sendLink = function() {
            if(!$scope.email) return

            $scope.sending = true
            $scope.key = makeKey()
            $http({
                    method : 'POST',
                    url    : API_URL + 'entity-' + ENTITY_VOTERS,
                    data   : getSignedData(API_USER, API_KEY, {
                        'definition': 'pd-voter',
                        'pd-voter-email': $scope.email,
                        'pd-voter-entu-api-key': $scope.key
                    })
                })
                .then(function(response) {
                    $scope.id = response.data.result.id
                    cl(response.data)
                    cl($scope.id)
                    $http({
                            method : 'POST',
                            url    : API_URL + 'entity-' + $scope.id + '/rights',
                            data   : getSignedData(API_USER, API_KEY, {
                                'entity': $scope.id,
                                'right': 'expander'
                            })
                        })
                        .then(function(response) {
                            cl(response.data)
                            cl($scope.id)
                            cl($scope.key)
                            var url = PAGE_URL + '#/voting/' + $scope.id + '/' + $scope.key
                            cl(url)
                            $http({
                                    method : 'POST',
                                    url    : API_URL + 'entity-' + $scope.id + '/rights',
                                    data   : getSignedData(API_USER, API_KEY, {
                                        'entity': API_USER
                                    })
                                })
                                .then(function(response) {
                                    $http({
                                            method : 'POST',
                                            url    : API_URL + 'email',
                                            data   : getSignedData(API_USER, API_KEY, {
                                                'to': $scope.email,
                                                'subject': 'ProgeTiiger õpilaskonkurss "Tuleviku õpperuum 2050" hääletus',
                                                'message': 'Siin on Sinu personaalne link ProgeTiiger õpilaskonkurss "Tuleviku õpperuum 2050" hääletusele.<br>\n<br>\n<a href="' + url + '">' + url + '</a><br>\n<br>\nÄra seda linki jaga!'
                                            })
                                        })
                                        .then(function(response) {
                                            $scope.sending = false
                                            $scope.sent = true
                                        }, function(response) {
                                            cl(response.data.error)
                                            $scope.sending = false
                                        })
                                }, function(response) {
                                    cl(response.data.error)
                                    $scope.sending = false
                                })
                        }, function(response) {
                            cl(response.data.error)
                            $scope.sending = false
                        })
                  }, function(response) {
                    cl(response.data.error)
                    $scope.sending = false
                }
            )
        }
    }])



// VOTING
    .controller('votingCtrl', ['$scope', '$http', '$routeParams', '$location', '$timeout', function($scope, $http, $routeParams, $location, $timeout) {

        $scope.works = []
        $scope.categories = {}
        $scope.agegroups = {}
        $scope.selected_agegroup = ''
        $scope.votes = {}

        $http({
                method : 'GET',
                url    : API_URL + 'entity-' + $routeParams.voter_id,
                params : getSignedData($routeParams.voter_id, $routeParams.voter_key, {})
            })
            .then(function(response) {
                if(response.data.result.properties['pd-work'].values) {
                    for(i in response.data.result.properties['pd-work'].values) {
                        $scope.votes[response.data.result.properties['pd-work'].values[i].db_value] = response.data.result.properties['pd-work'].values[i].id
                    }
                }

                $http({
                        method : 'GET',
                        url    : API_URL + 'entity-' + ENTITY_WORKS + '/childs',
                        params : getSignedData(API_USER, API_KEY, {
                            definition: 'pd-work',
                            limit: '1000'
                        })
                    })
                    .then(function(response) {
                        for (id in response.data.result['pd-work'].entities) {
                            $http({
                                    method : 'GET',
                                    url    : API_URL + 'entity-' + response.data.result['pd-work'].entities[id].id,
                                    params : getSignedData(API_USER, API_KEY, {})
                                })
                                .then(function(response) {
                                    $scope.works.push({
                                        id           : response.data.result.id,
                                        category     : response.data.result.properties.category.values[0].value,
                                        title        : response.data.result.properties.title.values[0].value,
                                        author       : response.data.result.properties.author.values[0].value,
                                        organization : response.data.result.properties.organization .values[0].value,
                                        url          : response.data.result.properties.url.values[0].value,
                                        agegroup     : response.data.result.properties.agegroup.values[0].value
                                    })
                                    $scope.works = mySort($scope.works, 'title')
                                    $scope.categories[response.data.result.properties.category.values[0].value] = null
                                    $scope.agegroups[response.data.result.properties.agegroup.values[0].value] = null
                                }, function(response) {
                                    cl(response.data.error)
                                })
                        }
                    }, function(response) {
                        cl(response.data.error)
                    })
            }, function(response) {
                $location.path('/voting')
            })

        $scope.doSelect = function(agegroup) {
            if($scope.selected_agegroup != agegroup) {
                $scope.selected_agegroup = agegroup
            } else {
                $scope.selected_agegroup = ''
            }
        }

        $scope.doVote = function(id) {
            var properties = {}

            if($scope.votes[id]) {
                properties['pd-voter-pd-work.' + $scope.votes[id]] = ''
                $http({
                        method : 'PUT',
                        url    : API_URL + 'entity-' + $routeParams.voter_id,
                        data   : getSignedData($routeParams.voter_id, $routeParams.voter_key, properties)
                    })
                    .then(function(response) {
                          delete $scope.votes[id]
                      }, function(response) {
                          cl(response.data.error)
                    })
            } else {
                properties['pd-voter-pd-work'] = id
                $http({
                        method : 'PUT',
                        url    : API_URL + 'entity-' + $routeParams.voter_id,
                        data   : getSignedData($routeParams.voter_id, $routeParams.voter_key, properties)
                    })
                    .then(function(response) {
                          var work = response.data.result.properties['pd-voter-pd-work'][0].value
                          var vote = response.data.result.properties['pd-voter-pd-work'][0].id
                          $scope.votes[work] = vote
                      }, function(response) {
                          cl(response.data.error)
                    })
            }
        }

    }])
