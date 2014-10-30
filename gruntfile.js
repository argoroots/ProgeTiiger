module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
            build: {
                src: 'tmp'
            },
        },
        copy: {
            font_awesome: {
                cwd: 'bower_components/font-awesome',
                src: ['fonts/*.*'],
                dest: 'fonts',
                expand: true,
                flatten: true,
            },
        },
        jade: {
            html: {
                options: {
                    pretty: false,
                },
                files: [{
                    expand: true,
                    cwd: 'source/views',
                    src: ['index.jade'],
                    dest: 'tmp',
                    ext: '.html'
                }]
            }
        },
        stylus: {
            css: {
                files: {
                    'tmp/application.css': [
                        'source/stylesheets/*.styl'
                    ]
                }
            }
        },
        fontAwesomeVars: {
            font_awesome: {
                variablesLessPath: 'bower_components/font-awesome/less/variables.less',
                fontPath: '/fonts'
            }
        },
        less: {
            font_awesome: {
                files: {
                    'tmp/font-awesome.css': [
                        'bower_components/font-awesome/less/font-awesome.less'
                    ]
                }
            }
        },
        cssmin : {
            frameworks: {
                options: {
                    keepSpecialComments: 0,
                },
                files: {
                    'tmp/stylesheet.css': [
                        'bower_components/bootstrap/dist/css/bootstrap.css',
                        'tmp/font-awesome.css',
                        'tmp/application.css'
                    ]
                }
            }
        },
        uglify: {
            frameworks: {
                files: {
                    'tmp/javascript.js': [
                        'bower_components/angular/angular.js',
                        'bower_components/angular-route/angular-route.js',
                        'bower_components/angular-resource/angular-resource.js',
                        'bower_components/angular-sanitize/angular-sanitize.js',
                        'bower_components/crypto-js/rollups/aes.js',
                        'bower_components/crypto-js/rollups/hmac-sha1.js',
                        'source/javascripts/*.js'
                    ]
                }
            }
        },
        includereplace: {
            all: {
                files: {
                    'index.html': [
                        'tmp/index.html'
                    ]
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 4000,
                    base: './',
                    hostname: 'localhost'
                }
            }
        },
        watch: {
            stylesheets: {
                files: 'source/**/*.styl',
                tasks: ['stylus', 'cssmin', 'includereplace']
            },
            scripts: {
                files: 'source/**/*.js',
                tasks: ['uglify', 'includereplace']
            },
            jade: {
                files: 'source/**/*.jade',
                tasks: ['jade', 'includereplace']
            },
        }
    })



    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-connect')
    grunt.loadNpmTasks('grunt-contrib-copy')
    grunt.loadNpmTasks('grunt-contrib-cssmin')
    grunt.loadNpmTasks('grunt-contrib-jade')
    grunt.loadNpmTasks('grunt-contrib-less')
    grunt.loadNpmTasks('grunt-contrib-stylus')
    grunt.loadNpmTasks('grunt-contrib-uglify')
    grunt.loadNpmTasks('grunt-contrib-watch')
    grunt.loadNpmTasks('grunt-font-awesome-vars')
    grunt.loadNpmTasks('grunt-include-replace')

    grunt.registerTask(
        'build',
        'Compiles all of the assets and copies the files to the build directory. Cleanup all mess.',
        ['clean', 'copy', 'jade', 'stylus', 'fontAwesomeVars', 'less', 'cssmin', 'uglify', 'includereplace']
    )

    grunt.registerTask(
        'default',
        'Watches the project for changes, automatically builds them and runs a server.',
        ['build', 'connect', 'watch']
    )
}
