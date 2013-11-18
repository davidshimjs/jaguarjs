/**
 * http://gruntjs.com/configuring-tasks
 */
module.exports = function (grunt) {
    var path = require('path');
    var scripts = grunt.file.readJSON('scripts.json');
    var SRC = SRC;
    var DIST = './dist';
    var names = {
        main: 'jaguar',
        addon: 'jaguar.addon',
        tool: 'jaguar.tool',
        ext: '.js'
    };

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
                src: SRC,
                files: scripts.main,
                tasks: ['default']
            },

            addon: {
                src: SRC,
                files: scripts.addon,
                tasks: ['addon']
            },

            tool: {
                src: SRC,
                files: scripts.tool,
                tasks: ['tool']
            }
        },

        // https://github.com/gruntjs/grunt-contrib-concat
        concat: {
            options: {
                // Workaround missing a semicolon
                separator: '\n;\n',
            },
            main: {
                src: SRC,
                files: scripts.main,
                dest: DIST + '/' + names.main + names.ext
            },
            addon: {
                src: SRC,
                files: scripts.addon,
                dest: DIST + '/' + names.addon + names.ext
            },
            tool: {
                src: SRC,
                files: scripts.tool,
                dest: DIST + '/' + names.tool + names.ext
            },
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
                files: [DIST + '/' + names.main + names.ext]
            }
        }

        // https://github.com/gruntjs/grunt-contrib-uglify
        // uglify: {
        //     build: {
        //         options: {
        //             // TODO Add a sourcemap option
        //         },
        //         src: path.join(DEPLOY_PATH, 'js/space.merge.js'),
        //         dest: path.join(DEPLOY_PATH, 'js/space.js')
        //     }
        // }
    });

    // Load task libraries
    [
        'grunt-contrib-connect',
        'grunt-contrib-watch',
        'grunt-contrib-copy',
        'grunt-contrib-concat',
        'grunt-contrib-uglify',
        'grunt-string-replace'
    ].forEach(function (taskName) {
        grunt.loadNpmTasks(taskName);
    });

    // Definitions of tasks
    grunt.resgisterTask('default', 'Build All files', [
        'main',
        'addon',
        'tool'
    ]);

    grunt.registerTask('main', 'Build a jaguar.js file', [
        'concat:main',
        'string-replace:main'
    ]);
    grunt.registerTask('addon', 'Build a jaguar.addon.js file', [
    ]);
    grunt.registerTask('tool', 'Build a jaguar.tool.js file', [
    ]);
};
