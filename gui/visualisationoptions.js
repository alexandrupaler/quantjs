function VisualisationOptions() {
    //map of keys (strings) and values (strings)
    //representing the visualisation option (key) and the corresponding checkbox in the document (value)
    this.options = {};

    //map of keys (strings) and values (objects threejs)
    //representing the visualisation option (key) and the corresponding array of objects in the webgl scene
    this.webglObjects = {};
}

VisualisationOptions.prototype.addOptionAndCheckbox = function (optionName, chkBoxName, webglObjArr) {
    this.options[optionName] = chkBoxName;

    this.webglObjects[optionName] = webglObjArr;
}

VisualisationOptions.prototype.collectValues = function () {
    var currentVisOptions = {};

    for (var key in this.options) {
        
        var val = document.getElementById(this.options[key]).checked;

        currentVisOptions[key] = {
            visible: val,
            globjs: this.webglObjects[key]
        };
    }

    return currentVisOptions;
}