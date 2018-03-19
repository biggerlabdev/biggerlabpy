function EditorController()
{
// bind event listeners to button clicks //
    //var that = this;

    $("#btn-replace").click(function(){ replaceIP(); });
    $("#server-list").click(function(){ getserver(); });
    $("#btn-save").click(function(){ save(); });
    $("#btn-load").click(function(){ load(); });
    $("#btn-run").click(function(){ runPythonScript(); });
    $("#btn-stop").click(function(){ stopPython(); });
    $("#btn-reset").click(function(){ reset(); });
    $("#btn-loadHint").click(function(){ loadHint(); });
    $("#btn-saveHint").click(function(){ saveHint(); });
    $("#btn-loadTemplate").click(function(){ changeToTemplate(false); });
    $("#btn-loadFinal").click(function(){ changeToTemplate(true); });

    editor.setValue(`import mcpi.minecraft as minecraft
mc = minecraft.Minecraft.create()
mc.postToChat("Hello Minecraft World")
# Welcome to BiggerLab's Minecraft Python Editor`);
    loadTemplates();

    if (user.userType === "student") {
        secondEditor.setOptions({
            readOnly: true,
            highlightActiveLine: false ,
            highlightGutterLine: false ,
        });
        secondEditor.setValue("# Teacher Hints");
    } else {
        secondEditor.setValue("# Paste your hints here");
    }
}

/*==================================*/
/*Your webserver IP after deployment*/
var ip =     "127.0.0.1";
/*==================================*/
var selectedServer =$('#server-list').val();
var teacherMode = false;
ace.require("ace/ext/language_tools");
var editor = ace.edit("editor");
editor.setTheme("ace/theme/xcode");
editor.getSession().setMode("ace/mode/python");
editor.$blockScrolling = Infinity;
var langTools = ace.require("ace/ext/language_tools");
editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true
});
var staticWordCompleter = {
    getCompletions: function(editor, session, pos, prefix, callback) {
        var wordList = ["minecraft", "Minecraft", "create", "player", "getTilePos", "setBlock", "events", "pollBlockHits", "pos", "getBlock", "postToChat"];
        callback(null, wordList.map(function(word) {
            return {
                caption: word,
                value: word,
                meta: "static"
            };
        }));

    }
};
langTools.addCompleter(staticWordCompleter);

var secondEditor = ace.edit("secondEditor");
secondEditor.setTheme("ace/theme/xcode");
secondEditor.getSession().setMode("ace/mode/python");
secondEditor.$blockScrolling = Infinity;
secondEditor.commands.commmandKeyBinding={};

var selectedID = "";
var ws = new WebSocket('ws://localhost:4000'); // ws://localhost:3000 | wss://biggerpyweb.herokuapp.com/
ws.onmessage = function (event) {
    if (!event.data) return;
    var receivedObject = JSON.parse(event.data)
    if (receivedObject.type === 'output') {
        if ($( "#log" ).html() === "Running... ") {
            $( "#log" ).html("");
        }
        $( "#log" ).append("<div style=\"white-space: pre-wrap; font-family: monospace;\">" + receivedObject.data + "</div>");
    }
    if (receivedObject.type === 'error') {
        if ($( "#log" ).html() === "Running... ") {
            //console.log(000000000);
            $( "#log" ).html("");
        }
        //console.log(111);
        $( "#log" ).append("<div style=\"white-space: pre-wrap; font-family: monospace;\"><b style=\"color:#AA0000;font-size:15px;\">" + receivedObject.data + "</b></div>");
    }
    console.log("------error data----------");
    console.log(event.data);
};
ws.addEventListener('open', function (event) {
    ws.send(JSON.stringify({'type': 'connect', 'user': user.user}))
});

function runPythonScript() {
    $( "#log" ).html("Running... ");
    var playerid = user.playerid;
    var selectedServer =$('#server-list').val();
    var data = editor.getValue();
    //console.log(data);
    var ifPos = data.search('mc.getPlayerEntityId');
    //console.log(ifPos);
    if  (ifPos === -1){
        //console.log(0);
        editor.find('minecraft\.Minecraft\.create\(.*\)',{regExp: true});
        editor.replaceAll('minecraft.Minecraft.create(address = "' + ip + '", port = ' + selectedServer + ') \n' +
            'myId = mc.getPlayerEntityId("'+ playerid + '")\n' + "pos = mc.entity.getTilePos(myId)");
    }else{
        //console.log(1);
        data = editor.getValue();
    }
    $.post("run", {"data":editor.getValue()},function( data ) {
        // do something
    });
}

function stopPython() {
    $( "#log" ).html("Stop");
    $.post("kill" ,function( data ) {
        data = "while True: break";
        // do something
    });
}

function getOption() {
    var obj = document.getElementById("selectList");
    if (obj.selectedIndex > 0) {
        document.getElementById("resulttitle").innerHTML = "<b>Your Minecraft 1.9.2 IP</b><br>";
    } else {
        document.getElementById("resulttitle").innerHTML = "";
    }
    //replaceIP();
}

function getLesson() {
    selectedID = $('#selectSampleCode').val();
    console.log(selectedID);
    save();
    load();
    //setTimeout('getserver()',5000);
}
//server
function getserver(){
    //* 选择server_list 确定往不同server发送python代码
    var selectedServer =$('#server-list').val();
    //console test
    // console.log("-----------------------");
    //console.log(selectedServer);
    editor.find('minecraft\.Minecraft\.create\(.*\)',{regExp: true});
    editor.replaceAll('minecraft.Minecraft.create(address = "' + ip + '", port = ' + selectedServer + ')');
}

function save() {
    $.post("home/save", {"entry": ("save" + selectedID) + (teacherMode ? "teach" : ""), "data": editor.getValue()}, function( data ) {
        console.log("Saved")
    });
}

function load() {
    $.post("home/load", {"entry": ("save" + selectedID) + (teacherMode ? "teach" : "")}, function( data ) {
        if (data) {
            const selectedServer =$('#server-list').val();
            //console test
            // console.log("-----------------------");
            //console.log(selectedServer);
            editor.setValue(data);
            editor.find('minecraft\.Minecraft\.create\(.*\)',{regExp: true});
            editor.replaceAll('minecraft.Minecraft.create(address = "' + ip + '", port = ' + selectedServer + ')');
        } else {
            loadLessonTemplate(selectedID, teacherMode);
            // editor.setValue(teacherMode ? lessonFinalForIndex(selectedIndex) : lessonTemplateForIndex(selectedIndex));
        }
    });
}

function reset() {
    selectedID = $('#selectSampleCode').val();
    loadLessonTemplate(selectedID, teacherMode);
    // editor.setValue(teacherMode ? lessonFinalForIndex(selectedIndex) : lessonTemplateForIndex(selectedIndex));
}

function loadLessonTemplate(id, teacher) {
    console.log(id);
    const selectedServer =$('#server-list').val();
    if (id === "Template Code") {
        editor.setValue(`import mcpi.minecraft as minecraft
                            mc = minecraft.Minecraft.create()
                            mc.postToChat("Hello Minecraft World")
                            # Welcome to BiggerLab's Minecraft Python Editor`);
        editor.find('minecraft\.Minecraft\.create\(.*\)',{regExp: true});
        editor.replaceAll('minecraft.Minecraft.create(address = "' + ip + '", port = ' + selectedServer + ')');
        return;
    }
    $.post("templates", {"id": id, "teacher": teacher}, function( data ) {
        if (data) {
            editor.setValue(data);
            editor.find('minecraft\.Minecraft\.create\(.*\)',{regExp: true});
            editor.replaceAll('minecraft.Minecraft.create(address = "' + ip + '", port = ' + selectedServer + ')');
            console.log(data)
        } else {
            console.log("error template")
            // error
        }
    });
}

function replaceIP() {
    var obj = document.getElementById("selectList");
    const selectedServer =$('#server-list').val();
    if (obj.selectedIndex > 0) {
        document.getElementById("result").innerHTML = ip + ":" + (25565 + obj.selectedIndex - 1);
        editor.find('minecraft\.Minecraft\.create\(.*\)',{regExp: true});
        editor.replaceAll('minecraft.Minecraft.create(address = "' + ip + '", port = ' + selectedServer + ')');
    } else {
        document.getElementById("result").innerHTML = "";
        editor.find('minecraft\.Minecraft\.create\(.*\)',{regExp: true});
        editor.replaceAll('minecraft.Minecraft.create()');
    }
}

function saveHint() {
    $.post("hints", {"data": secondEditor.getValue()}, function(data) {
        console.log(data);
    });
}

function loadHint() {
    $.get("hints", function(data) {
        secondEditor.setValue(data);
    });
}

function loadTemplates() {
    $.post("load_template_list", function(data) {
        if (data) {
            var currentLesson = 0;
            var htmlToInsert = '';
            for (var i = 0; i < data.length; i++) {
                if (data[i]["lesson"] > currentLesson) {
                    currentLesson = data[i]["lesson"];
                    htmlToInsert += '<optgroup label="Lesson ' + currentLesson + '">';
                }
                htmlToInsert += '<option value="' + data[i]["_id"].toString() + '">'+data[i]["title"]+'</option>';
                if (i + 1 >= data.length || data[i + 1]["lesson"] > currentLesson) {
                    htmlToInsert += '</optgroup>';
                }
            }
            $("#selectSampleCode").append(htmlToInsert);
            $("#selectSampleCode").selectpicker("refresh");
        } else {
            // error
        }
    });
}

function changeToTemplate(teacher) {
    console.log(teacher);
    save();
    teacherMode = teacher;
    load();
}
