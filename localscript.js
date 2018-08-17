function LocalScript() {

}

LocalScript.readNewLine = function (inputStream) {
    var fileLine = "";

    //read one byte at a time
    var length = 1;
    var buf = new Uint8Array(length);

    var stopread = false;
    while (!stopread) {
        try {
            var bread = FS.read(inputStream, buf, 0, length);
            // console.log("read bytes: " + bread);
        }
        catch (error) {
            //for some reason, it did not work
            stopread = true;
            console.log("error: " + error);
        }

        if (!stopread) {
            //is this function from emscripten? - yes
            var character = "" + UTF8ArrayToString(buf, 0);

            if (character == "\n") {
                stopread = true;
                // console.log("new line");
            }
            else {
                // console.log("no");
            }

            fileLine = fileLine.concat(character);
        }
    }

    // console.log("returned line: " + fileLine);
    return fileLine;
}

LocalScript.writeLine = function (outStream, line) {
    var buf = new Uint8Array(lengthBytesUTF8(line) + 1);
    var actualNumBytes = stringToUTF8Array(line, buf, 0, buf.length);
    FS.write(outStream, buf, 0, actualNumBytes, undefined);
}

LocalScript.putInParanthesis = function (inputStream, outputStream, nrLines) {
    for (var i = 0; i < nrLines; i++) {
        var line2 = LocalScript.readNewLine(inputStream).trim();

        line2 = "[" + line2 + "]";
        if (i != nrLines - 1)
            line2 = line2 + ",";

        LocalScript.writeLine(outputStream, line2);
    }
}

LocalScript.graph2js = function (inputFileName, varName, outputFileName) {
    //create the streams
    var inStream = undefined;

    //read parameters
    var nrinj = 0;
    var edges = 0;
    var nodes = 0;
    var inj = "";

    console.log("GRAPH2JS " + inputFileName + " -> " + outputFileName);

    try {
        inStream = FS.open(inputFileName, "r");

        nrinj = parseInt(LocalScript.readNewLine(inStream));//0; //`head -1 $file | tail -1`
        edges = parseInt(LocalScript.readNewLine(inStream));//0; //`head -2 $file | tail -1`
        nodes = parseInt(LocalScript.readNewLine(inStream));//0; //`head -3 $file | tail -1`
        inj = LocalScript.readNewLine(inStream).trim();//0; //"head -4 $file | tail -1"
    }
    catch (error) {
        console.log(inputFileName);
        console.log(error);
        //return;

        // reset the vars. something was wrong?
        // write an empty file
        nrinj = 0;
        edges = 0;
        nodes = 0;
        inj = "";

        inStream = null;
    }

    try {
        //delete if exists
        FS.unlink(outputFileName);
    }
    catch{ }

    var outStream = FS.open(outputFileName, "w");

    // var line = "var " + varName + "={\"inj\":[" + inj + "],\"edges\":[";
    var line = "{\"inj\":[" + inj + "],\"edges\":[";

    LocalScript.writeLine(outStream, line);

    if (edges != 0) {
        LocalScript.putInParanthesis(inStream, outStream, edges);
    }

    LocalScript.writeLine(outStream, "],\"nodes\":[");

    if (nodes != 0) {
        LocalScript.putInParanthesis(inStream, outStream, nodes);
    }

    LocalScript.writeLine(outStream, "]}");

    //close the files
    if (inStream != null)
        FS.close(inStream);

    FS.close(outStream);
}

LocalScript.localScript = function (timestamp, module) {
    //reset stdout emulation
    document.getElementById('output').innerText = "";

    var file = timestamp + "circuit.raw.in";
    var afail = 0.0;
    var tfail = 0.001;
    var yfail = 0.5;
    var pfail = 0.001;
    var schedulingType = 2;

    var convert = "yes";

    try {
        FS.unlink(file + ".geom");
        FS.unlink(file + ".geom.io.toconnect.geom");
        FS.unlink(file + ".geom.io.toconnect.geomdebug1");
        FS.unlink(file + ".geom.io.toconnect.geomdebug2");
    }
    catch{ }

    if (convert == "yes") {
        var main_args = [file, "xxx", afail, tfail, yfail, pfail, schedulingType];
        module.callMain(main_args);

        console.log("converted");
        console.log("scheduled");
    }
    else {
        console.log("no convert");
    }

    // generate .js files
    LocalScript.graph2js(file + ".geom", "graph", file + ".js_1");
    LocalScript.graph2js(file + ".geom.io.toconnect.geom", "graph2", file + ".js_2");

    LocalScript.graph2js(file + ".geom.io.toconnect.geomdebug1", "graph3", file + ".js_3");
    LocalScript.graph2js(file + ".geom.io.toconnect.geomdebug2", "graph4", file + ".js_4");

    console.log("generated geometry");

    //the names of the generated files
    return [file + ".js_1", file + ".js_2", file + ".js_3", file + ".js_4"];
}
