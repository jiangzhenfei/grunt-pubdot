/*
 * grunt-pubdot
 * https://github.com/jiangzhenfei/grunt-pubdot
 *
 * Copyright (c) 2017 江振飞
 */
'use strict';

module.exports = function (grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('pubdot', 'a tool for dot publishment', function () {
        var options = this.options({});
        var should_update_server = options.target_dot_server;
        var target_port = options.target_dot_port;
        var username = options.dot_username;
        var password = options.dot_password;

        var exec = require('child_process').exec;
        var client_scp = require('scp2');
        var Client = require('ssh2').Client;
        //异步操作
        var done = this.async();

        //获取130等虚拟节点下的节点
        function resolveDot(str){
            var regx = /kdcos-ui-([\d\.]+)/g;
            var result;
            var dot=[]

            while ((result = regx.exec(str)) != null)  {
                dot.push(result[1])
            }
            return dot
            
        }
        var server = {}
        function link_all_server(my_target_server){
           server[my_target_server] = new Client();
            server[my_target_server].on('ready', function () {
                console.log(my_target_server + 'is connected');
                server[my_target_server].exec("kubectl get pod -n kube-system|grep ui;", function (err, stream) {
                    if (err) {
                        console.log('false')
                    }
                    stream.on('close', function (code, signal) {
                        console.log('Stream1 :: close :: code: ' + code + ', signal: ' + signal);
                        server[my_target_server].end();
                    }).on('data', function (data) {
                        console.log('STDOUT1: ' + data);
                        var dot = resolveDot(data)
                        for(var i = 0;i < dot.length; i++){
                            update_dot(dot[i])//去每个节点执行文件update_ui_from_199.sh
                        }
                    }).stderr.on('data', function (data) {
                            console.log('STDERR1: ' + data);
                        });
                });
            }).connect({
                host: my_target_server,
                port: target_port,
                username: username,
                password: password
            });
        }

        //节点下执行已经存在的脚本，更新前端ui
        var dot = {}
        function update_dot(target_server_pra){
            dot[target_server_pra] = new Client();
            dot[target_server_pra].on('ready', function () {
                console.log(target_server_pra + "dot is connected");
                dot[target_server_pra].exec("./update_ui_from_199.sh;", function (err, stream) {
                    if (err) {
                        console.log('false')
                    }
                    stream.on('close', function (code, signal) {
                        console.log('Stream2 :: close :: code: ' + code + ', signal: ' + signal);
                        dot[target_server_pra].end();
                    }).on('data', function (data) {
                        console.log('STDOUT2: ' + data);
                    }).stderr.on('data', function (data) {
                            console.log('STDERR2: ' + data);
                        });
                });
            }).connect({
                host: target_server_pra,
                port: target_port,
                username: username,
                password: password
            });
        }

        function start(should_update_server){
           should_update_server.forEach(function(v){
               link_all_server(v)
           }) 
        }

        /*start*/
        start(should_update_server)

    });
}
