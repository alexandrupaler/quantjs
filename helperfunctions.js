function CompilationHelpers() {

}

/*
    Objects used for the visualisation
*/
CompilationHelpers.graph1 = null;
CompilationHelpers.graph2 = null;
CompilationHelpers.graph3 = null;
CompilationHelpers.graph4 = null;
CompilationHelpers.boxes = null;

CompilationHelpers.preLoadFiles = function (timestamp, circuitFileContents) {
    console.log("pre run");

    //Do not have a better idea to check existence of files and dirs
    try {
        FS.stat("seeds.txt");
    }
    catch{
        FS.writeFile('seeds.txt', "100");
    }

    try {
        //try to delete the file if it exists
        FS.unlink(timestamp + 'circuit.raw.in');
    }
    catch{ }

    FS.writeFile(timestamp + 'circuit.raw.in', circuitFileContents);

    // console.log("-------");
    // console.log(FS.readFile('circuit.raw.in', { encoding: 'utf8' }));
}

/*
    Take the circuit from the textarea for the moment
*/
CompilationHelpers.startCompiled = function (gateListTextArea) {
    //dummy contents of circuit.raw.in
    // var circuitFileContents = "\
    // in ---\n\
    // out ---\n\
    // T 0 1 2\n\
    // T 1 2 0\n\
    // T 2 0 1\n";

    // var timestamp = (new Date()).getTime();
    // console.log("TIMESTAMP " + timestamp);

    //do not timestampt the files used as input or output
    //this was used for debuggin purposes of the transpiled convertft.js
    //when this is done, the plmbing piece view has been disabled
    var timestamp = "";

    var circuitFileContents = document.getElementById(gateListTextArea).value;
    //skip first line
    var posNL = circuitFileContents.indexOf("\n");
    circuitFileContents = circuitFileContents.substring(posNL + 1);

    CompilationHelpers.preLoadFiles(timestamp, circuitFileContents);

    var generatedFiles = LocalScript.localScript(timestamp, Module);

    CompilationHelpers.generateLinksForDownload(generatedFiles, "downloadlinks");
    CompilationHelpers.constructTheHugeVariables(timestamp, generatedFiles);
}

CompilationHelpers.generateLinksForDownload = function (generatedFiles, linksContainer) {
    //reset container
    document.getElementById(linksContainer).innerHTML = "";

    //
    for (var i = 0; i < generatedFiles.length; i++) {
        //genereaza cu DOM la fel cum fac in quantjs
        document.getElementById(linksContainer).innerHTML += "<a href=#>" + generatedFiles[i] + "</a>&nbsp;";
    }
}

CompilationHelpers.constructTheHugeVariables = function (timestamp, generatedFiles) {
    CompilationHelpers.graph1 = JSON.parse(FS.readFile(generatedFiles[0], { encoding: 'utf8' }));
    CompilationHelpers.graph2 = JSON.parse(FS.readFile(generatedFiles[1], { encoding: 'utf8' }));
    CompilationHelpers.graph3 = JSON.parse(FS.readFile(generatedFiles[2], { encoding: 'utf8' }));
    CompilationHelpers.graph4 = JSON.parse(FS.readFile(generatedFiles[3], { encoding: 'utf8' }));

    //start the visualisation
    eval(FS.readFile(timestamp + "circuit.raw.in.geom.io.box.0", { encoding: 'utf8' }));
    CompilationHelpers.boxes = boxes0;
}