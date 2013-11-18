jaguar.js
========

Javascript animation library optimized mobile devices. This project forked the [collie.js](http://jindo.dev.naver.com/collie) library.

How to build
---
1. Download project using `git clone` or fork to your own.
    ```
    $ git clone https://github.com/davidshimjs/jaguarjs.git
    ```

2. Install npm packages with a simple command
    ```
    $ npm install
    ```
    If you don't have npm, you can install a [node.js](http://nodejs.org) included a npm.

3. Using a grunt

    ```
    $ grunt build
    ```    
    There are many commands for building the jaguar project.
    - `default` or an empty value: Watch project files. It'll build all files when you edit .js files.
    - `build`: Build all files. Destination is a `dist` folder.
    - `minify`: Minify all files. Destination is a `dist` folder.