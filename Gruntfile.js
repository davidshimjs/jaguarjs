/**
 * http://gruntjs.com/configuring-tasks
 */
module.exports = function (grunt) {
    var path = require('path');
    var scripts = grunt.file.readJSON('scripts.json');
    var SRC = './src';
    var DIST = './dist';
    var names = {
        main: 'jaguar',
        addon: 'jaguar.addon',
        tool: 'jaguar.tool',
        ext: '.js',
        min: '.min'
    };

    // Prepend a source path
    for (var i in scripts) {
        scripts[i] = scripts[i].map(function (v) {
            return SRC + '/' + v;
        });
    }

    grunt.initConfig({
        // 패키지 파일
        pkg: grunt.file.readJSON('package.json'),

        connect: {
            options: {
                hostname: '*'
            },
            dev: {
                options: {
                    port: 8000,
                    base: SRC,
                    middleware: function (connect, options) {
                        return [
                            require('connect-livereload')(),
                            connect.static(path.resolve(options.base))
                        ];
                    }
                }
            }
        },

        watch: {
            main: {
                files: scripts.main,
                tasks: ['main']
            },

            addon: {
                files: scripts.addon,
                tasks: ['addon']
            },

            tool: {
                files: scripts.tool,
                tasks: ['tool']
            }
        },

        // https://github.com/gruntjs/grunt-contrib-concat
        concat: {
            options: {
                // Workaround missing a semicolon
                separator: '\n;\n'
            },
            main: {
                src: scripts.main,
                dest: DIST + '/' + names.main + names.ext
            },
            addon: {
                src: scripts.addon,
                dest: DIST + '/' + names.addon + names.ext
            },
            tool: {
                src: scripts.tool,
                dest: DIST + '/' + names.tool + names.ext
            }
        },

        'string-replace': {
            main: {
                options: {
                    replacements: [
                        {
                            pattern: /\{\{version\}\}/g,
                            replacement: '<%=pkg.version%>'
                        }
                    ]
                },
                src: DIST + '/' + names.main + names.ext,
                dest: DIST + '/' + names.main + names.ext
            },

            minify: {
                options: {
                    replacements: [
                        {
                            pattern: /\{\{version\}\}/g,
                            replacement: '<%=pkg.version%>'
                        }
                    ]
                },
                src: DIST + '/' + names.main + names.min + names.ext,
                dest: DIST + '/' + names.main + names.min + names.ext
            }
        },

        // https://github.com/gruntjs/grunt-contrib-uglify
        uglify: {
            main: {
                options: {
                    // TODO Add a sourcemap option
                },
                src: scripts.main,
                dest: DIST + '/' + names.main + names.min + names.ext
            },
            addon: {
                options: {
                    // TODO Add a sourcemap option
                },
                src: scripts.addon,
                dest: DIST + '/' + names.addon + names.min + names.ext
            },
            tool: {
                options: {
                    // TODO Add a sourcemap option
                },
                src: scripts.tool,
                dest: DIST + '/' + names.tool + names.min + names.ext
            }
        }
    });

    // Load task libraries
    [
        'grunt-contrib-connect',
        'grunt-contrib-watch',
        'grunt-contrib-concat',
        'grunt-contrib-uglify',
        'grunt-string-replace'
    ].forEach(function (taskName) {
        grunt.loadNpmTasks(taskName);
    });

    // Definitions of tasks
    grunt.registerTask('default', 'Watch project files', [
        'build', 'watch'
    ]);

    grunt.registerTask('build', 'Build a jaguar.js file', [
        'main', 'addon', 'tool'
    ]);

    grunt.registerTask('main', 'Build a jaguar.js file', [
        'concat:main',
        'string-replace:main'
    ]);

    grunt.registerTask('addon', 'Build a jaguar.addon.js file', [
        'concat:addon'
    ]);
    
    grunt.registerTask('tool', 'Build a jaguar.tool.js file', [
        'concat:tool'
    ]);

    grunt.registerTask('minify', 'Minify All jaguar files', [
        'uglify:main',
        'uglify:addon',
        'uglify:tool',
        'string-replace:minify'
    ]);
};
