'use strict';

var config = require('./config/default.json');

module.exports = function(grunt) {
  var CI = grunt.option('ci');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        ignores: ['test/frontend/karma-include/*', 'frontend/js/modules/modernizr.js'],
        reporter: CI && 'checkstyle',
        reporterOutput: CI && 'jshint.xml'
      },
      all: {
        src: [
          'Gruntfile.js',
          'Gruntfile-tests.js',
          'tasks/**/*.js',
          'test/**/**/*.js',
          'backend/**/*.js',
          'frontend/js/**/*.js',
          'modules/**/*.js'
        ]
      },
      quick: {
        // You must run the prepare-quick-lint target before jshint:quick,
        // files are filled in dynamically.
        src: []
      }
    },
    gjslint: {
      options: {
        flags: [
          '--disable 0110',
          '--nojsdoc',
          '-e test/frontend/karma-include',
          '-x frontend/js/modules/modernizr.js'
        ],
        reporter: {
          name: CI ? 'gjslint_xml' : 'console',
          dest: CI ? 'gjslint.xml' : undefined
        }
      },
      all: {
        src: ['<%= jshint.all.src %>']
      },
      quick: {
        src: ['<%= jshint.quick.src %>']
      }
    },
    lint_pattern: {
      options: {
        rules: [
          { pattern: /(describe|it)\.only/, message: 'Must not use .only in tests' }
        ]
      },
      all: {
        src: ['<%= jshint.all.src %>']
      },
      quick: {
        src: ['<%= jshint.quick.src %>']
      }
    },
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          env: {NODE_ENV: 'dev'},
          ignore: ['frontend/**', '.git', 'README.md', 'node_modules/**', 'test/**', 'doc/**', 'fixtures/**', 'log/**'],
          watchedExtensions: ['js'],
          callback: function(nodemon) {
            nodemon.on('log', function(event) {
              console.log(event.colour);
            });

            nodemon.on('config:update', function() {
              // Delay before server listens on port
              setTimeout(function() {
                require('open')('http://localhost:' + config.webserver.port || 8080);
              }, 2000);
            });
          }
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },
    'node-inspector': {
      dev: {
        options: {
          'web-host': 'localhost',
          'web-port': config.webserver.debugPort || 8081,
          'save-live-edit': true,
          'no-preload': true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-gjslint');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-node-inspector');
  grunt.loadNpmTasks('grunt-lint-pattern');

  grunt.loadTasks('tasks');


  grunt.registerTask('dev', ['nodemon:dev']);
  grunt.registerTask('debug', ['node-inspector:dev']);
  grunt.registerTask('linters', 'Check code for lint', ['jshint:all', 'gjslint:all', 'lint_pattern:all']);

  /**
   * Usage:
   *   grunt linters-dev              # Run linters against files changed in git
   *   grunt linters-dev -r 51c1b6f   # Run linters against a specific changeset
   */
  grunt.registerTask('linters-dev', 'Check changed files for lint', ['prepare-quick-lint', 'jshint:quick', 'gjslint:quick', 'lint_pattern:quick']);

  grunt.registerTask('default', ['test']);
  grunt.registerTask('fixtures', 'Launch the fixtures injection', function() {
    var done = this.async();
    require('./fixtures')(function(err) {
      done(err ? false : true);
    });
  });
};
